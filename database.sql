--
-- PostgreSQL database dump
--

\restrict jGmRcVZo41kni9jZHghKWIO783rxTXjwr2rHyKjEWwbhm8WUQKuZn2Nq831FaPc

-- Dumped from database version 17.6 (Debian 17.6-2.pgdg12+1)
-- Dumped by pg_dump version 17.6 (Debian 17.6-2.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccessType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AccessType" AS ENUM (
    'REMOTE_CONTROL',
    'KEYS'
);


ALTER TYPE public."AccessType" OWNER TO postgres;

--
-- Name: GarageType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GarageType" AS ENUM (
    'COVERED',
    'UNCOVERED'
);


ALTER TYPE public."GarageType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'CONDUCTOR',
    'CONDUCTOR_PROPIETARIO'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: Garage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Garage" (
    id text NOT NULL,
    "userId" text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    type public."GarageType" NOT NULL,
    height double precision NOT NULL,
    width double precision NOT NULL,
    length double precision NOT NULL,
    "hasGate" boolean DEFAULT false NOT NULL,
    "hasCameras" boolean DEFAULT false NOT NULL,
    "accessType" public."AccessType" NOT NULL,
    rules text,
    images text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Garage" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text,
    role public."UserRole" DEFAULT 'CONDUCTOR'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "firstName" text,
    "lastName" text,
    phone text,
    "profileCompleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Vehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Vehicle" (
    id text NOT NULL,
    "userId" text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer,
    "licensePlate" text NOT NULL,
    height double precision,
    width double precision,
    length double precision,
    "minHeight" double precision,
    "coveredOnly" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Vehicle" OWNER TO postgres;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: makes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.makes (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.makes OWNER TO postgres;

--
-- Name: makes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.makes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.makes_id_seq OWNER TO postgres;

--
-- Name: makes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.makes_id_seq OWNED BY public.makes.id;


--
-- Name: models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.models (
    id integer NOT NULL,
    make_id integer,
    name character varying(100) NOT NULL,
    length_mm integer,
    width_mm integer,
    height_mm integer
);


ALTER TABLE public.models OWNER TO postgres;

--
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.models_id_seq OWNER TO postgres;

--
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;


--
-- Name: makes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.makes ALTER COLUMN id SET DEFAULT nextval('public.makes_id_seq'::regclass);


--
-- Name: models id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Garage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Garage" (id, "userId", address, city, latitude, longitude, type, height, width, length, "hasGate", "hasCameras", "accessType", rules, images, "isActive", "createdAt", "updatedAt") FROM stdin;
cmhjt8a0y000gdfytg7vklon2	cmhjt7qn5000edfytoxh0ed22	4059, Humahuaca, Almagro, Buenos Aires, Comuna 5, Autonomous City of Buenos Aires, C1192ACB, Argentina	Buenos Aires	-34.601743	-58.4217091	UNCOVERED	2	2.5	5	f	t	REMOTE_CONTROL		{https://res.cloudinary.com/dvqnag5e4/image/upload/v1762214860/garages/dx2u4tac2bfah8ufbwt8.jpg}	t	2025-11-04 00:07:42.272	2025-11-04 00:07:42.272
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, "createdAt", "updatedAt", "firstName", "lastName", phone, "profileCompleted") FROM stdin;
cmhjt7qn5000edfytoxh0ed22	Valentino Balatti	valentinobalatti4@gmail.com	\N	\N	$2b$12$Omtg4LKHC95fevsC9ttVg.0ivvL4gWgIqx07C3Xo.C9eHn.Ic0kj.	CONDUCTOR	2025-11-04 00:07:17.154	2025-11-04 00:07:27.448	Valentino	Balatti	2346566284	t
\.


--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Vehicle" (id, "userId", brand, model, year, "licensePlate", height, width, length, "minHeight", "coveredOnly", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d2b73177-372f-427a-b095-0c1f9c2011de	5677ed4022c0a15ba94d615a0cc50726d8baca7a1a55e195a56e61d0d827f77a	2025-11-03 13:55:58.334844-03	20251103165558	\N	\N	2025-11-03 13:55:58.316302-03	1
b7e27bb8-d03b-45c2-ae98-8ad1c57d3952	33e9e4cbeb5817343910e0c29e40fd79b9bb3ad7ca967b5dff062504eb53fe58	2025-11-03 14:23:19.992117-03	20251103172319_user_profile	\N	\N	2025-11-03 14:23:19.983166-03	1
\.


--
-- Data for Name: makes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.makes (id, name) FROM stdin;
1	Toyota
2	Ford
3	Chevrolet
4	Honda
\.


--
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.models (id, make_id, name, length_mm, width_mm, height_mm) FROM stdin;
1	4	Civic	4551	1802	1408
2	4	Fit	4090	1725	1545
3	1	Corolla	4630	1780	1435
4	3	Cruze	4600	1790	1480
\.


--
-- Name: makes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.makes_id_seq', 4, true);


--
-- Name: models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.models_id_seq', 4, true);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Garage Garage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Garage"
    ADD CONSTRAINT "Garage_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vehicle Vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: makes makes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.makes
    ADD CONSTRAINT makes_name_key UNIQUE (name);


--
-- Name: makes makes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.makes
    ADD CONSTRAINT makes_pkey PRIMARY KEY (id);


--
-- Name: models models_make_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_make_id_name_key UNIQUE (make_id, name);


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Garage Garage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Garage"
    ADD CONSTRAINT "Garage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Vehicle Vehicle_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: models models_make_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_make_id_fkey FOREIGN KEY (make_id) REFERENCES public.makes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jGmRcVZo41kni9jZHghKWIO783rxTXjwr2rHyKjEWwbhm8WUQKuZn2Nq831FaPc

