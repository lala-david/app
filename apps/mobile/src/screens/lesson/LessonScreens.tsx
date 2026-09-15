import { Redirect, useLocalSearchParams } from 'expo-router';

import { useLesson, type LessonContext } from '@/features/lesson/model/lessonContext';
import { QuizStep } from '@/features/lesson/ui/QuizStep';
import { SpeakStep } from '@/features/lesson/ui/SpeakStep';
import { VideoStep } from '@/features/lesson/ui/VideoStep';

/** 주소의 ?key= 로 레슨을 찾고, 없으면 홈으로 */
function withLesson(Step: (props: { context: LessonContext }) => React.ReactElement) {
  return function LessonRoute() {
    const { key } = useLocalSearchParams<{ key?: string }>();
    const context = useLesson(key);
    if (!context) return <Redirect href="/home" />;
    return <Step context={context} />;
  };
}

export const LessonVideoScreen = withLesson(VideoStep);
export const LessonQuizScreen = withLesson(QuizStep);
export const LessonSpeakScreen = withLesson(SpeakStep);
