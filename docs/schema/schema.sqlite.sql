CREATE TABLE characters (
	"key" VARCHAR(16) NOT NULL, 
	name_ko VARCHAR(16) NOT NULL, 
	PRIMARY KEY ("key")
);

CREATE TABLE weeks (
	week_no SMALLINT NOT NULL, 
	theme VARCHAR(32) NOT NULL, 
	headline VARCHAR(64) NOT NULL, 
	subline VARCHAR(64) NOT NULL, 
	activity_title VARCHAR(64) NOT NULL, 
	playlist_id VARCHAR(64) NOT NULL, 
	days SMALLINT NOT NULL, 
	PRIMARY KEY (week_no), 
	CONSTRAINT ck_weeks_no_range CHECK (week_no BETWEEN 1 AND 48), 
	CONSTRAINT ck_weeks_days_range CHECK (days BETWEEN 1 AND 7)
);

CREATE TABLE words (
	id VARCHAR(32) NOT NULL, 
	ko VARCHAR(32) NOT NULL, 
	word_group VARCHAR(16) NOT NULL, 
	swatch VARCHAR(7), 
	PRIMARY KEY (id), 
	CONSTRAINT ck_words_group CHECK (word_group IN ('color', 'thing', 'routine'))
);

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	consent_version VARCHAR(32) NOT NULL, 
	notify_consent BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_users_email_lowercase CHECK (email = lower(email)), 
	UNIQUE (email)
);

CREATE TABLE routines (
	"key" VARCHAR(16) NOT NULL, 
	order_no SMALLINT NOT NULL, 
	title VARCHAR(32) NOT NULL, 
	short_title VARCHAR(16) NOT NULL, 
	title_en VARCHAR(32) NOT NULL, 
	target_minutes SMALLINT NOT NULL, 
	tone VARCHAR(16) NOT NULL, 
	character_key VARCHAR(16) NOT NULL, 
	requires_faith BOOLEAN NOT NULL, 
	PRIMARY KEY ("key"), 
	CONSTRAINT ck_routines_target_positive CHECK (target_minutes > 0), 
	CONSTRAINT ck_routines_order_positive CHECK (order_no > 0), 
	UNIQUE (order_no), 
	FOREIGN KEY(character_key) REFERENCES characters ("key") ON DELETE RESTRICT
);

CREATE TABLE week_words (
	week_no SMALLINT NOT NULL, 
	word_id VARCHAR(32) NOT NULL, 
	position SMALLINT NOT NULL, 
	is_focus BOOLEAN NOT NULL, 
	PRIMARY KEY (week_no, word_id), 
	CONSTRAINT uq_week_words_position UNIQUE (week_no, position), 
	CONSTRAINT ck_week_words_position_positive CHECK (position > 0), 
	FOREIGN KEY(week_no) REFERENCES weeks (week_no) ON DELETE CASCADE, 
	FOREIGN KEY(word_id) REFERENCES words (id) ON DELETE RESTRICT
);

CREATE TABLE week_sentences (
	id INTEGER NOT NULL, 
	week_no SMALLINT NOT NULL, 
	text VARCHAR(128) NOT NULL, 
	answer_word_id VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_week_sentences_text UNIQUE (week_no, text), 
	FOREIGN KEY(week_no) REFERENCES weeks (week_no) ON DELETE CASCADE, 
	FOREIGN KEY(answer_word_id) REFERENCES words (id) ON DELETE RESTRICT
);

CREATE INDEX ix_week_sentences_week_no ON week_sentences (week_no);

CREATE TABLE children (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	nickname VARCHAR(16) NOT NULL, 
	age_band VARCHAR(8) NOT NULL, 
	uses_photo BOOLEAN NOT NULL, 
	avatar_character VARCHAR(16), 
	start_date DATE NOT NULL, 
	run SMALLINT NOT NULL, 
	run_start_date DATE NOT NULL, 
	faith_enabled BOOLEAN NOT NULL, 
	notifications_enabled BOOLEAN NOT NULL, 
	evening_reminder BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_children_age_band CHECK (age_band IN ('6', '7', '8', '9-10')), 
	CONSTRAINT ck_children_nickname_not_blank CHECK (length(trim(nickname)) > 0), 
	CONSTRAINT ck_children_run_positive CHECK (run >= 1), 
	CONSTRAINT ck_children_run_after_start CHECK (run_start_date >= start_date), 
	CONSTRAINT ck_children_has_avatar CHECK (uses_photo OR avatar_character IS NOT NULL), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(avatar_character) REFERENCES characters ("key") ON DELETE RESTRICT
);

CREATE INDEX ix_children_user_id ON children (user_id);

CREATE TABLE push_subscriptions (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	endpoint VARCHAR(1024) NOT NULL, 
	p256dh VARCHAR(255) NOT NULL, 
	auth VARCHAR(255) NOT NULL, 
	user_agent VARCHAR(255) NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	UNIQUE (endpoint)
);

CREATE INDEX ix_push_subscriptions_user_id ON push_subscriptions (user_id);

CREATE TABLE week_routines (
	week_no SMALLINT NOT NULL, 
	routine_key VARCHAR(16) NOT NULL, 
	guide VARCHAR(128) NOT NULL, 
	sentence VARCHAR(128) NOT NULL, 
	video_id VARCHAR(16), 
	video_playlist_id VARCHAR(64), 
	video_title VARCHAR(128) NOT NULL, 
	video_channel VARCHAR(64) NOT NULL, 
	duration_sec INTEGER, 
	PRIMARY KEY (week_no, routine_key), 
	CONSTRAINT ck_week_routines_has_video CHECK (video_id IS NOT NULL OR video_playlist_id IS NOT NULL), 
	CONSTRAINT ck_week_routines_duration_positive CHECK (duration_sec IS NULL OR duration_sec > 0), 
	FOREIGN KEY(week_no) REFERENCES weeks (week_no) ON DELETE CASCADE, 
	FOREIGN KEY(routine_key) REFERENCES routines ("key") ON DELETE RESTRICT
);

CREATE TABLE routine_schedules (
	child_id VARCHAR(36) NOT NULL, 
	routine_key VARCHAR(16) NOT NULL, 
	time_local VARCHAR(5) NOT NULL, 
	enabled BOOLEAN NOT NULL, 
	PRIMARY KEY (child_id, routine_key), 
	CONSTRAINT ck_routine_schedules_time CHECK (time_local GLOB '[0-2][0-9]:[0-5][0-9]' AND time_local < '24:00'), 
	FOREIGN KEY(child_id) REFERENCES children (id) ON DELETE CASCADE, 
	FOREIGN KEY(routine_key) REFERENCES routines ("key") ON DELETE RESTRICT
);

CREATE INDEX ix_routine_schedules_time ON routine_schedules (time_local);

CREATE TABLE routine_records (
	id VARCHAR(36) NOT NULL, 
	child_id VARCHAR(36) NOT NULL, 
	record_date DATE NOT NULL, 
	routine_key VARCHAR(16) NOT NULL, 
	running_since BIGINT, 
	accumulated_sec INTEGER NOT NULL, 
	listened_min SMALLINT NOT NULL, 
	completion VARCHAR(8), 
	completed_at BIGINT, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_routine_records_day_routine UNIQUE (child_id, record_date, routine_key), 
	CONSTRAINT ck_routine_records_completion CHECK (completion IS NULL OR completion IN ('timer', 'manual', 'parent')), 
	CONSTRAINT ck_routine_records_completion_pair CHECK ((completion IS NULL) = (completed_at IS NULL)), 
	CONSTRAINT ck_routine_records_non_negative CHECK (accumulated_sec >= 0 AND listened_min >= 0), 
	CONSTRAINT ck_routine_records_stopped_when_done CHECK (completed_at IS NULL OR running_since IS NULL), 
	FOREIGN KEY(child_id) REFERENCES children (id) ON DELETE CASCADE, 
	FOREIGN KEY(routine_key) REFERENCES routines ("key") ON DELETE RESTRICT
);

CREATE INDEX ix_routine_records_child_date ON routine_records (child_id, record_date);

CREATE TABLE activity_records (
	id VARCHAR(36) NOT NULL, 
	child_id VARCHAR(36) NOT NULL, 
	week_no SMALLINT NOT NULL, 
	record_date DATE NOT NULL, 
	stars SMALLINT NOT NULL, 
	completed_at BIGINT, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_activity_records_day UNIQUE (child_id, week_no, record_date), 
	CONSTRAINT ck_activity_records_stars CHECK (stars >= 0), 
	FOREIGN KEY(child_id) REFERENCES children (id) ON DELETE CASCADE, 
	FOREIGN KEY(week_no) REFERENCES weeks (week_no) ON DELETE RESTRICT
);

CREATE INDEX ix_activity_records_child_id ON activity_records (child_id);

CREATE TABLE events (
	id INTEGER NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	child_id VARCHAR(36), 
	name VARCHAR(40) NOT NULL, 
	payload JSON NOT NULL, 
	occurred_at BIGINT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(child_id) REFERENCES children (id) ON DELETE SET NULL
);

CREATE INDEX ix_events_user_id ON events (user_id);

CREATE INDEX ix_events_name ON events (name);

CREATE TABLE quiz_answers (
	id INTEGER NOT NULL, 
	activity_id VARCHAR(36) NOT NULL, 
	question_id VARCHAR(8) NOT NULL, 
	question_type VARCHAR(16) NOT NULL, 
	word_id VARCHAR(32), 
	correct BOOLEAN NOT NULL, 
	response_ms INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_quiz_answers_question UNIQUE (activity_id, question_id), 
	CONSTRAINT ck_quiz_answers_type CHECK (question_type IN ('pickImage', 'pickWord', 'match', 'sentenceColor')), 
	CONSTRAINT ck_quiz_answers_ms CHECK (response_ms >= 0), 
	CONSTRAINT ck_quiz_answers_word_by_type CHECK ((question_type = 'match') = (word_id IS NULL)), 
	FOREIGN KEY(activity_id) REFERENCES activity_records (id) ON DELETE CASCADE, 
	FOREIGN KEY(word_id) REFERENCES words (id) ON DELETE RESTRICT
);

CREATE INDEX ix_quiz_answers_activity_id ON quiz_answers (activity_id);

CREATE TABLE speak_attempts (
	id INTEGER NOT NULL, 
	activity_id VARCHAR(36) NOT NULL, 
	word_id VARCHAR(32) NOT NULL, 
	heard VARCHAR(64) NOT NULL, 
	score FLOAT NOT NULL, 
	result VARCHAR(16) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_speak_attempts_word UNIQUE (activity_id, word_id), 
	CONSTRAINT ck_speak_attempts_result CHECK (result IN ('pass', 'passAfterRetry', 'passByParent', 'given', 'skipped')), 
	CONSTRAINT ck_speak_attempts_score CHECK (score BETWEEN 0 AND 1), 
	FOREIGN KEY(activity_id) REFERENCES activity_records (id) ON DELETE CASCADE, 
	FOREIGN KEY(word_id) REFERENCES words (id) ON DELETE RESTRICT
);

CREATE INDEX ix_speak_attempts_activity_id ON speak_attempts (activity_id);
