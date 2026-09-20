import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSentence, playSfx, playWord } from '@/entities/content/voice';
import { createRng, seedFrom, shuffle, type Question } from '@/entities/quiz/buildQuiz';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { colors, radius, tones } from '@/shared/theme/tokens';

import { ChoiceTile, SpeakerButton, tileStatus } from './Tiles';

export interface QuestionProps<Q extends Question = Question> {
  question: Q;
  locked: boolean;
  onAnswer: (correct: boolean) => void;
}

const AUTOPLAY_DELAY_MS = 350;

/** 소리를 듣고 맞는 그림 고르기 */
function PickImage({ question, locked, onAnswer }: QuestionProps<Extract<Question, { type: 'pickImage' }>>) {
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => playWord(question.answer), AUTOPLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [question]);

  return (
    <View style={styles.root}>
      <SpeakerButton onPress={() => playWord(question.answer)} label={question.answer} />
      <View style={styles.grid}>
        {question.options.map((option) => (
          <ChoiceTile key={option} style={styles.cell} label={getWord(option).ko} status={tileStatus(option, question.answer, chosen, locked)} disabled={locked} onPress={() => { setChosen(option); onAnswer(option === question.answer); }}>
            <AssetImage name={getWord(option).image} size={112} />
          </ChoiceTile>
        ))}
      </View>
    </View>
  );
}

/** 그림을 보고 맞는 단어 고르기. 누르면 단어를 읽어준다 */
function PickWord({ question, locked, onAnswer }: QuestionProps<Extract<Question, { type: 'pickWord' }>>) {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <View style={styles.root}>
      <View style={styles.picture}>
        <AssetImage name={getWord(question.answer).image} size={180} />
      </View>
      <View style={styles.wordOptions}>
        {question.options.map((option) => (
          <ChoiceTile key={option} style={styles.wordOption} label={option} status={tileStatus(option, question.answer, chosen, locked)} disabled={locked} onPress={() => { playWord(option); setChosen(option); onAnswer(option === question.answer); }}>
            <View style={styles.wordRow}>
              <Icon name="speaker" size={22} color={colors.inkFaint} />
              <AppText variant="word">{option}</AppText>
            </View>
          </ChoiceTile>
        ))}
      </View>
    </View>
  );
}

/** “It's red.” 를 듣고 색 찾기 */
function SentenceColor({ question, locked, onAnswer }: QuestionProps<Extract<Question, { type: 'sentenceColor' }>>) {
  const [chosen, setChosen] = useState<string | null>(null);
  const play = () => playSentence(question.sentence.audio, question.sentence.text);
  useEffect(() => {
    const timer = setTimeout(() => playSentence(question.sentence.audio, question.sentence.text), AUTOPLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [question]);

  return (
    <View style={styles.root}>
      <SpeakerButton onPress={play} label={question.sentence.text} />
      {locked ? (
        <AppText variant="word" align="center">
          {question.sentence.text}
        </AppText>
      ) : null}
      <View style={styles.grid}>
        {question.options.map((option) => (
          <ChoiceTile key={option} style={styles.cell} label={getWord(option).ko} status={tileStatus(option, question.answer, chosen, locked)} disabled={locked} onPress={() => { setChosen(option); onAnswer(option === question.answer); }}>
            <AssetImage name={getWord(option).image} size={100} />
          </ChoiceTile>
        ))}
      </View>
    </View>
  );
}

const SOUND_COLORS = [tones.morning.c, tones.theme.c, tones.dinner.c, tones.bedtime.c];

/** 소리 버튼과 그림 짝 맞추기 */
function Match({ question, locked, onAnswer }: QuestionProps<Extract<Question, { type: 'match' }>>) {
  const pictures = useMemo(() => shuffle(question.pairs, createRng(seedFrom(`${question.id}:pictures`))), [question]);
  const [active, setActive] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);

  const pressPicture = (word: string) => {
    if (!active || matched.includes(word)) return;
    if (word !== active) {
      setMistakes((m) => m + 1);
      setWrong(word);
      setTimeout(() => setWrong(null), 450);
      playSfx('wrong');
      return;
    }
    const next = [...matched, word];
    setMatched(next);
    setActive(null);
    if (next.length === question.pairs.length) onAnswer(mistakes === 0);
    else playSfx('correct');
  };

  return (
    <View style={styles.matchRoot}>
      <View style={styles.column}>
        {question.pairs.map((word, i) => {
          const done = matched.includes(word);
          return (
            <ChoiceTile key={word} style={styles.matchCell} label={`sound ${i + 1}`} status={done ? 'matched' : active === word ? 'active' : 'idle'} disabled={locked || done} onPress={() => { setActive(word); playWord(word); }}>
              <View style={[styles.sound, { backgroundColor: done ? colors.brand : SOUND_COLORS[i % SOUND_COLORS.length] }]}>
                <Icon name={done ? 'check' : 'speaker'} size={26} color={colors.white} strokeWidth={3} />
              </View>
            </ChoiceTile>
          );
        })}
      </View>
      <View style={styles.column}>
        {pictures.map((word) => {
          const done = matched.includes(word);
          return (
            <ChoiceTile key={word} style={styles.matchCell} label={getWord(word).ko} status={done ? 'matched' : wrong === word ? 'wrong' : 'idle'} disabled={locked || done} onPress={() => pressPicture(word)}>
              <AssetImage name={getWord(word).image} size={62} />
            </ChoiceTile>
          );
        })}
      </View>
    </View>
  );
}

function QuestionBody(props: QuestionProps) {
  const { question } = props;
  switch (question.type) {
    case 'pickImage':
      return <PickImage {...props} question={question} />;
    case 'pickWord':
      return <PickWord {...props} question={question} />;
    case 'sentenceColor':
      return <SentenceColor {...props} question={question} />;
    case 'match':
      return <Match {...props} question={question} />;
  }
}

/** 문제 위에 무엇을 하면 되는지 한 줄로 알려 준다 */
export function QuestionView(props: QuestionProps) {
  return (
    <View style={styles.flex}>
      <AppText variant="cardTitle" align="center" style={styles.hint}>
        {strings.activity.hints[props.question.type]}
      </AppText>
      <QuestionBody {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hint: { marginTop: 4 },
  root: { flex: 1, gap: 20, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  cell: { width: '47%', aspectRatio: 1.05 },
  picture: { alignSelf: 'center', borderRadius: radius.hero, padding: 16, backgroundColor: tones.theme.p },
  wordOptions: { gap: 12 },
  wordOption: { height: 76 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  matchRoot: { flex: 1, flexDirection: 'row', gap: 16, alignItems: 'center' },
  column: { flex: 1, gap: 12 },
  matchCell: { height: 84 },
  sound: { width: 52, height: 52, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
