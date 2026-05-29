-- Run this in Supabase SQL Editor after backend/supabase_auth_schema.sql
-- This script can be re-run safely by reseeding content data.
-- Schema and seed run in separate transactions so schema survives seed errors.

BEGIN;

CREATE TABLE IF NOT EXISTS public.clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    logo TEXT NOT NULL,
    banner TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
    id BIGINT PRIMARY KEY,
    club_id TEXT NOT NULL REFERENCES public.clubs (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    participants INTEGER NOT NULL DEFAULT 0 CHECK (participants >= 0),
    max_participants INTEGER NOT NULL DEFAULT 0 CHECK (max_participants >= 0),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tags VARCHAR(15)[],
    CHECK (max_participants = 0 OR participants <= max_participants)
);

CREATE TABLE IF NOT EXISTS public.event_reviews (
    event_id BIGINT PRIMARY KEY REFERENCES public.events (id) ON DELETE CASCADE,
    review_rating NUMERIC(3,1) NOT NULL CHECK (review_rating >= 0 AND review_rating <= 5),
    review_attendance INTEGER NOT NULL CHECK (review_attendance >= 0),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_feedback (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
    club_id TEXT NOT NULL REFERENCES public.clubs (id) ON DELETE CASCADE,
    user_id BIGINT,
    rating NUMERIC(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clubs_category ON public.clubs (category);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON public.events (club_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events (featured);
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON public.event_feedback (event_id);

COMMIT;

BEGIN;

WITH clubs_seed AS (
    SELECT *
    FROM jsonb_to_recordset(
        $$
        [
          {"id":"acm","name":"ACM","category":"Technology","banner":"../assets/images/acm/banner.png","description":"Association for Computing Machinery - For Competitive Programming enthusiasts."},
          {"id":"cine_radio","name":"Cine Radio","category":"Arts","banner":"../assets/images/cine_radio/banner.jpg","description":"Explore the world of cinema and music through creative content and many fun events!"},
          {"id":"jci","name":"JCI","category":"Entrepreneurship","banner":"../assets/images/jci/banner.png","description":"Junior Chamber International - Building a better world through positive change and civic engagement."},
          {"id":"ieee","name":"IEEE","category":"Technology","banner":"../assets/images/ieee/banner.png","description":"Innovate with the world's largest technical community, with many fields including CS, Robotics, Aeronotics..."},
          {"id":"insat_press","name":"INSAT Press","category":"Social","banner":"../assets/images/insat_press/banner.png","description":"The country's first University press club."},
          {"id":"securinets","name":"Securinets","category":"Technology","banner":"../assets/images/securinets/banner.png","description":"Learn cybersecurity skills, participate in competitions, and build a strong foundation in information security."},
          {"id":"junior","name":"Junior Entreprise","category":"Entrepreneurship","banner":"../assets/images/junior/banner.jpg","description":"An educational association offering services in the field of IT."},
          {"id":"aerobotix","name":"Aerobotix","category":"Technology","banner":"../assets/images/aerobotix/banner.png","description":"The common ground for Robotics & Aeronautics, learn, create, innovate."},
          {"id":"theatro","name":"Theatro","category":"Arts","banner":"../assets/images/theatro/banner.jpg","description":"A club dedicated to theatrical arts, including acting, directing, stage production, music..."},
          {"id":"3zero","name":"3ZERO","category":"Social","banner":"../assets/images/3zero/banner.jpg","description":"A club eager to make an impact on our environment and raise awareness."},
          {"id":"android","name":"Android Club","category":"Technology","banner":"../assets/images/android/banner.jpg","description":"IAC is the first Android development club in Tunisia, formed by young INSAT students."},
          {"id":"genesis_labs","name":"Genesis Labs","category":"Technology","banner":"../assets/images/genesis_labs/banner.jpg","description":"First BioInformatics club at INSAT."}
        ]
        $$::jsonb
    ) AS c(
        id TEXT,
        name TEXT,
        category TEXT,
        banner TEXT,
        description TEXT
    )
)
INSERT INTO public.clubs (id, name, category, logo, banner, description)
SELECT
    id,
    name,
    category,
    format('../assets/images/%s/profile.jpg', id) AS logo,
    banner,
    description
FROM clubs_seed
;

WITH events_seed AS (
    SELECT *
    FROM jsonb_to_recordset(
        $$
        [
          {"id":1,"title":"Data Overflow","club":"IEEE","clubLogo":"../assets/images/ieee/profile.jpg","image":"../assets/images/ieee/event-data_overflow.png","date":"2026-01-28","time":"14:00","location":"Everything Everywhere All at Once","description":"DO is a cycle of trainings that will be concluded with a hackathon in the field of Data Science & AI.","participants":30,"maxparticipants":50,"featured":true},
          {"id":2,"title":"Winter Cup 8.0","club":"ACM","clubLogo":"../assets/images/acm/profile.jpg","image":"../assets/images/acm/event-winter_cup.jpg","date":"2026-02-28","time":"22:00","location":"Reading Room","description":"Annual programming competition featuring challenges from beginner to advanced.","participants":45,"maxparticipants":100,"featured":true},
          {"id":3,"title":"IEEEXtreme Programming Competition","club":"IEEE","clubLogo":"../assets/images/ieee/profile.jpg","image":"../assets/images/ieee/event-ieeextreme.jpg","date":"2025-10-24","time":"19:00","location":"Reading Room","description":"24-hour global programming competition organized by IEEE.","participants":60,"maxparticipants":80,"featured":false},
          {"id":4,"title":"Run Beyond Limits","club":"IEEE","clubLogo":"../assets/images/ieee/profile.jpg","image":"../assets/images/ieee/event-run_beyond_limits.jpg","date":"2025-10-12","time":"09:00","location":"Campus Grounds","description":"In celebration of IEEE Day 2025, IEEE INSAT Student Branch is organizing a special Light Run.","participants":120,"maxparticipants":200,"featured":false},
          {"id":5,"title":"IEEE Summer School","club":"IEEE","clubLogo":"../assets/images/ieee/profile.jpg","image":"../assets/images/ieee/event-summer_school.jpg","date":"2025-09-27","time":"09:00","location":"Samsung Room","description":"INtroductory workshops to Computer Science fields.","participants":25,"maxparticipants":40,"featured":false},
          {"id":6,"title":"Computer Vision Workshop","club":"IEEE","clubLogo":"../assets/images/ieee/profile.jpg","image":"../assets/images/ieee/event-workshop_do_cv.jpg","date":"2026-02-04","time":"14:00","location":"Conference Room 2B6-01","description":"Hands-on workshop on computer vision and image processing.","participants":20,"maxparticipants":30,"featured":false},
          {"id":7,"title":"NLP Workshop","club":"IEEE","clubLogo":"../assets/images/ieee/profile.jpg","image":"../assets/images/ieee/event-workshop_do_nlp.jpg","date":"2026-02-14","time":"09:00","location":"Amphitheater A6","description":"Introduction to Natural Language Processing and text analytics.","participants":18,"maxparticipants":30,"featured":false},
          {"id":8,"title":"Data N'Beyond","club":"IEEE","clubLogo":"../assets/images/ieee/profile.jpg","image":"../assets/images/ieee/event-data'nbeyond_do.jpg","date":"2026-02-12","time":"14:00","location":"Auditorium","description":"Conference on data science, big data, and analytics.","participants":50,"maxparticipants":100,"featured":false},
          {"id":9,"title":"Code Quest","club":"ACM","clubLogo":"../assets/images/acm/profile.jpg","image":"../assets/images/acm/event-code_quest.png","date":"2025-11-30","time":"09:00","location":"Reading Room","description":"Coding challenge competition for beginners.","participants":35,"maxparticipants":60,"featured":false},
          {"id":10,"title":"N8N Automation Workshop","club":"ACM","clubLogo":"../assets/images/acm/profile.jpg","image":"../assets/images/acm/event-n8n.jpg","date":"2026-01-18","time":"14:00","location":"Amphitheater A6","description":"Learn workflow automation with n8n platform.","participants":15,"maxparticipants":25,"featured":false},
          {"id":11,"title":"Number Theory Workshop","club":"ACM","clubLogo":"../assets/images/acm/profile.jpg","image":"../assets/images/acm/event-number_theory.jpg","date":"2026-02-05","time":"20:00","location":"Online","description":"Deep dive into number theory and its applications in competitive programming.","participants":20,"maxparticipants":35,"featured":false},
          {"id":12,"title":"CyberCamp","club":"Securinets","clubLogo":"../assets/images/securinets/profile.jpg","image":"../assets/images/securinets/event-cybercamp.jpg","date":"2025-12-13","time":"08:00","location":"Conference Rooms","description":"Intensive cybersecurity training camp for beginners and intermediates.","participants":30,"maxparticipants":40,"featured":false},
          {"id":13,"title":"CyberSphere","club":"Securinets","clubLogo":"../assets/images/securinets/profile.jpg","image":"../assets/images/securinets/event-cybershpere.jpg","date":"2026-04-15","time":"10:00","location":"Cooking","description":"National Cybersecurity congress, Tunisia at the core of the Cyber Revolution.","participants":80,"maxparticipants":150,"featured":false},
          {"id":14,"title":"The Darkest Hour","club":"Securinets","clubLogo":"../assets/images/securinets/profile.jpg","image":"../assets/images/securinets/event-darkest_hour.jpg","date":"2026-02-13","time":"19:00","location":"Reading Room","description":"Night-time cybersecurity challenge event.","participants":40,"maxparticipants":60,"featured":false},
          {"id":15,"title":"Local CTF","club":"Securinets","clubLogo":"../assets/images/securinets/profile.jpg","image":"../assets/images/securinets/event-local_ctf.jpg","date":"2026-01-28","time":"14:00","location":"Securinets' co-working space","description":"Local Capture The Flag competition for INSAT students.","participants":25,"maxparticipants":40,"featured":false},
          {"id":16,"title":"AeroDay","club":"Aerobotix","clubLogo":"../assets/images/aerobotix/profile.jpg","image":"../assets/images/aerobotix/event-aeroday.jpg","date":"2026-02-01","time":"08:00","location":"Campus Grounds","description":"Showcase of aeronautics and robotics projects.","participants":50,"maxparticipants":80,"featured":false},
          {"id":17,"title":"Arduino Workshop","club":"Aerobotix","clubLogo":"../assets/images/aerobotix/profile.jpg","image":"../assets/images/aerobotix/event-arduino_workshop.jpg","date":"2025-09-17","time":"14:00","location":"Campus Grounds","description":"Learn Arduino programming and electronics basics.","participants":22,"maxparticipants":30,"featured":false},
          {"id":18,"title":"Green Cup","club":"Aerobotix","clubLogo":"../assets/images/aerobotix/profile.jpg","image":"../assets/images/aerobotix/event-green_cup.jpg","date":"2025-10-04","time":"17:00","location":"Campus Field","description":"Eco-friendly robotics competition focused on sustainability.","participants":30,"maxparticipants":50,"featured":false},
          {"id":19,"title":"Open Workshop","club":"Aerobotix","clubLogo":"../assets/images/aerobotix/profile.jpg","image":"../assets/images/aerobotix/event-open_workshop.jpg","date":"2025-09-13","time":"09:00","location":"Aerobotix' co-working space","description":"Open session for exploring robotics and electronics projects.","participants":15,"maxparticipants":25,"featured":false},
          {"id":20,"title":"Robolympix","club":"Aerobotix","clubLogo":"../assets/images/aerobotix/profile.jpg","image":"../assets/images/aerobotix/event-robolympix.jpg","date":"2026-04-19","time":"08:00","location":"Campus Grounds","description":"Annual robotics olympics with multiple challenges.","participants":60,"maxparticipants":100,"featured":true},
          {"id":21,"title":"SolidWorks Workshop","club":"Aerobotix","clubLogo":"../assets/images/aerobotix/profile.jpg","image":"../assets/images/aerobotix/event-solidworks_workshop.jpg","date":"2025-09-17","time":"14:00","location":"Campus Grounds","description":"CAD workshop using SolidWorks for 3D modeling.","participants":18,"maxparticipants":25,"featured":false},
          {"id":22,"title":"Artcade","club":"Cine Radio","clubLogo":"../assets/images/cine_radio/profile.jpg","image":"../assets/images/cine_radio/event-artcade.jpg","date":"2025-10-22","time":"13:00","location":"University Hall","description":"Art and arcade games exhibition celebrating digital art.","participants":40,"maxparticipants":70,"featured":false},
          {"id":23,"title":"ICC - INSAT Celebre le Cinema","club":"Cine Radio","clubLogo":"../assets/images/cine_radio/profile.jpg","image":"../assets/images/cine_radio/event-icc.jpg","date":"2025-12-06","time":"09:00","location":"Auditorium","description":"Celebration of international cultures through cinema and music.","participants":100,"maxparticipants":150,"featured":false},
          {"id":24,"title":"Unplugged Music Night","club":"Cine Radio","clubLogo":"../assets/images/cine_radio/profile.jpg","image":"../assets/images/cine_radio/event-unplugged.png","date":"2026-02-11","time":"14:00","location":"University Hall","description":"Acoustic music performances by talented students.","participants":80,"maxparticipants":120,"featured":false},
          {"id":25,"title":"Académie des Conseillers","club":"JCI","clubLogo":"../assets/images/jci/profile.jpg","image":"../assets/images/jci/event-academie_des_conseillers.jpg","date":"2026-02-14","time":"08:00","location":"Campus Grounds","description":"Training academy for developing leadership and consulting skills.","participants":25,"maxparticipants":35,"featured":false},
          {"id":26,"title":"From Code to Impact","club":"JCI","clubLogo":"../assets/images/jci/profile.jpg","image":"../assets/images/jci/event-from_code_to_impact.jpg","date":"2026-02-21","time":"09:00","location":"Online","description":"Learn how to turn your coding skills into impactful social projects.","participants":30,"maxparticipants":50,"featured":false},
          {"id":27,"title":"Heritage Global Village","club":"JCI","clubLogo":"../assets/images/jci/profile.jpg","image":"../assets/images/jci/event-heritage_global_villahe.jpg","date":"2026-05-06","time":"08:00","location":"University Hall","description":"Celebration of global heritage and cultural diversity.","participants":150,"maxparticipants":200,"featured":false},
          {"id":28,"title":"Rose et Précoce","club":"JCI","clubLogo":"../assets/images/jci/profile.jpg","image":"../assets/images/jci/event-rose_et_precoce.jpg","date":"2025-10-08","time":"09:00","location":"University Hall and Conference Rooms","description":"Special event to raise awareness about Breast Cancer.","participants":60,"maxparticipants":80,"featured":false},
          {"id":29,"title":"Forum JE","club":"Junior Entreprise","clubLogo":"../assets/images/junior/profile.jpg","image":"../assets/images/junior/event-forum.jpg","date":"2025-11-26","time":"08:00","location":"University Hall","description":"Business forum connecting students with industry professionals.","participants":70,"maxparticipants":100,"featured":false},
          {"id":30,"title":"Hack for Good","club":"Junior Entreprise","clubLogo":"../assets/images/junior/profile.jpg","image":"../assets/images/junior/event-hack_for_good.jpg","date":"2025-11-14","time":"00:00","location":"Online","description":"Hackathon focused on creating solutions for Road Safety.","participants":40,"maxparticipants":60,"featured":false},
          {"id":31,"title":"Seneca Hackathon","club":"Junior Entreprise","clubLogo":"../assets/images/junior/profile.jpg","image":"../assets/images/junior/event-seneca.jpg","date":"2025-09-12","time":"12:00","location":"University Hall and Auditorium","description":"Conference on entrepreneurship and business development, followed by a Hackathon.","participants":50,"maxparticipants":80,"featured":false},
          {"id":32,"title":"Aam Baad Thmenin","club":"Theatro","clubLogo":"../assets/images/theatro/profile.jpg","image":"../assets/images/theatro/event-aam_baad_thmenin.jpg","date":"2026-02-20","time":"19:30","location":"Main Theater","description":"Original theatrical production celebrating local stories.","participants":120,"maxparticipants":180,"featured":false},
          {"id":33,"title":"Al Fazaa","club":"Theatro","clubLogo":"../assets/images/theatro/profile.jpg","image":"../assets/images/theatro/event-al_fazaa.jpg","date":"2025-12-03","time":"16:00","location":"Auditorium","description":"Drama performance exploring themes of courage and resilience.","participants":100,"maxparticipants":150,"featured":false}
        ]
        $$::jsonb
    ) AS e(
        id BIGINT,
        title TEXT,
        club TEXT,
        image TEXT,
        date DATE,
        time TIME,
        location TEXT,
        description TEXT,
        participants INTEGER,
        maxParticipants INTEGER,
        featured BOOLEAN
    )
),
mapped_events AS (
    SELECT
        e.id,
        CASE e.club
            WHEN 'ACM' THEN 'acm'
            WHEN 'Cine Radio' THEN 'cine_radio'
            WHEN 'JCI' THEN 'jci'
            WHEN 'IEEE' THEN 'ieee'
            WHEN 'Securinets' THEN 'securinets'
            WHEN 'Junior Entreprise' THEN 'junior'
            WHEN 'Aerobotix' THEN 'aerobotix'
            WHEN 'Theatro' THEN 'theatro'
            WHEN '3ZERO' THEN '3zero'
            WHEN 'Android Club' THEN 'android'
            WHEN 'Genesis Labs' THEN 'genesis_labs'
            WHEN 'INSAT Press' THEN 'insat_press'
            ELSE NULL
        END AS club_id,
        e.title,
        e.image,
        e.date,
        e.time,
        e.location,
        e.description,
        e.participants,
        e.maxParticipants,
        e.featured
    FROM events_seed e
)
INSERT INTO public.events (
    id,
    club_id,
    title,
    image,
    event_date,
    event_time,
    location,
    description,
    participants,
    max_participants,
    featured
)
SELECT
    me.id,
    me.club_id,
    me.title,
    me.image,
    me.date,
    me.time,
    me.location,
    me.description,
    me.participants,
    me.maxParticipants,
    me.featured
FROM mapped_events me
WHERE me.club_id IS NOT NULL
;

COMMIT;

-- Quick validation queries:
-- SELECT COUNT(*) AS clubs_count FROM public.clubs;
-- SELECT COUNT(*) AS events_count FROM public.events;
