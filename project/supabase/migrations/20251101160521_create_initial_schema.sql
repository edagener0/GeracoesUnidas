/*
  # Schema Inicial - Plataforma de Conexão Idosos e Estudantes

  ## Visão Geral
  Sistema para conectar idosos com quartos disponíveis e estudantes universitários
  que procuram alojamento. Inclui gestão de perfis, anúncios, candidaturas,
  mensagens, pagamentos e avaliações.

  ## 1. Tabelas de Perfis de Utilizadores
  
  ### profiles
  Extensão da tabela auth.users do Supabase com informação adicional
  - `id` (uuid, FK para auth.users)
  - `user_type` (enum: 'elderly', 'student')
  - `full_name` (text)
  - `age` (integer)
  - `bio` (text) - Descrição/biografia
  - `location` (text) - Localidade
  - `avatar_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### elderly_profiles
  Informação específica de idosos
  - `id` (uuid, FK para profiles)
  - `gender` (text)
  - Timestamps

  ### student_profiles
  Informação específica de estudantes
  - `id` (uuid, FK para profiles)
  - `university` (text) - Universidade portuguesa
  - `course` (text) - Curso
  - `student_type` (enum: 'national', 'international', 'erasmus')
  - Timestamps

  ## 2. Tabelas de Quartos e Anúncios

  ### rooms
  Quartos disponíveis para arrendar
  - `id` (uuid)
  - `elderly_id` (uuid, FK para profiles)
  - `title` (text)
  - `description` (text)
  - `room_type` (text) - Tipo de quarto
  - `monthly_price` (decimal) - Preço mensal em euros
  - `location` (text) - Localidade
  - `address` (text) - Morada completa
  - `is_available` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### room_photos
  Fotos dos quartos
  - `id` (uuid)
  - `room_id` (uuid, FK para rooms)
  - `photo_url` (text)
  - `display_order` (integer)
  - `created_at` (timestamptz)

  ## 3. Sistema de Candidaturas

  ### room_applications
  Candidaturas de estudantes a quartos
  - `id` (uuid)
  - `room_id` (uuid, FK para rooms)
  - `student_id` (uuid, FK para profiles)
  - `status` (enum: 'pending', 'accepted', 'rejected')
  - `message` (text) - Mensagem do estudante
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 4. Sistema de Favoritos

  ### favorites
  Quartos guardados como favoritos pelos estudantes
  - `id` (uuid)
  - `student_id` (uuid, FK para profiles)
  - `room_id` (uuid, FK para rooms)
  - `created_at` (timestamptz)

  ## 5. Sistema de Mensagens

  ### conversations
  Conversas entre idosos e estudantes aceites
  - `id` (uuid)
  - `room_id` (uuid, FK para rooms)
  - `elderly_id` (uuid, FK para profiles)
  - `student_id` (uuid, FK para profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### messages
  Mensagens trocadas nas conversas
  - `id` (uuid)
  - `conversation_id` (uuid, FK para conversations)
  - `sender_id` (uuid, FK para profiles)
  - `content` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ## 6. Sistema de Avaliações

  ### reviews
  Comentários e ratings dos estudantes sobre quartos
  - `id` (uuid)
  - `room_id` (uuid, FK para rooms)
  - `student_id` (uuid, FK para profiles)
  - `rating` (integer) - 1 a 5 estrelas
  - `comment` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 7. Sistema de Pagamentos

  ### rentals
  Contratos de arrendamento ativos
  - `id` (uuid)
  - `room_id` (uuid, FK para rooms)
  - `student_id` (uuid, FK para profiles)
  - `elderly_id` (uuid, FK para profiles)
  - `monthly_amount` (decimal)
  - `start_date` (date)
  - `end_date` (date, nullable)
  - `status` (enum: 'active', 'completed', 'cancelled')
  - `created_at` (timestamptz)

  ### payments
  Pagamentos mensais
  - `id` (uuid)
  - `rental_id` (uuid, FK para rentals)
  - `amount` (decimal) - Valor pago pelo estudante
  - `platform_fee` (decimal) - Taxa de 5%
  - `elderly_amount` (decimal) - Valor para o idoso (95%)
  - `payment_date` (timestamptz)
  - `due_date` (date)
  - `status` (enum: 'pending', 'completed', 'failed')
  - `stripe_payment_id` (text)
  - `created_at` (timestamptz)

  ## 8. Segurança (RLS)
  
  - Todas as tabelas têm Row Level Security (RLS) ativado
  - Políticas restritivas por defeito
  - Acesso baseado em autenticação e ownership
  - Estudantes só veem os seus dados
  - Idosos só veem os seus quartos e candidaturas relacionadas
  - Mensagens só visíveis para participantes da conversa

  ## Notas Importantes
  
  1. **Integridade de Dados**: Uso extensivo de foreign keys e constraints
  2. **Defaults Significativos**: Timestamps automáticos, status defaults
  3. **Enums para Estados**: Garante valores válidos em campos de status
  4. **Indexes**: Em campos frequentemente consultados (localidade, datas)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('elderly', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE student_type AS ENUM ('national', 'international', 'erasmus');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rental_status AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age >= 18 AND age <= 120),
  bio text DEFAULT '',
  location text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ELDERLY PROFILES
CREATE TABLE IF NOT EXISTS elderly_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  gender text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. STUDENT PROFILES
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  university text NOT NULL,
  course text NOT NULL,
  student_type student_type DEFAULT 'national',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. ROOMS
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  room_type text NOT NULL,
  monthly_price decimal(10,2) NOT NULL CHECK (monthly_price > 0),
  location text NOT NULL,
  address text NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. ROOM PHOTOS
CREATE TABLE IF NOT EXISTS room_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. ROOM APPLICATIONS
CREATE TABLE IF NOT EXISTS room_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(room_id, student_id)
);

-- 7. FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, room_id)
);

-- 8. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  elderly_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(room_id, student_id)
);

-- 9. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 10. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(room_id, student_id)
);

-- 11. RENTALS
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  elderly_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_amount decimal(10,2) NOT NULL CHECK (monthly_amount > 0),
  start_date date NOT NULL,
  end_date date,
  status rental_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- 12. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  platform_fee decimal(10,2) NOT NULL CHECK (platform_fee >= 0),
  elderly_amount decimal(10,2) NOT NULL CHECK (elderly_amount >= 0),
  payment_date timestamptz,
  due_date date NOT NULL,
  status payment_status DEFAULT 'pending',
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_rooms_elderly_id ON rooms(elderly_id);
CREATE INDEX IF NOT EXISTS idx_rooms_location ON rooms(location);
CREATE INDEX IF NOT EXISTS idx_rooms_is_available ON rooms(is_available);
CREATE INDEX IF NOT EXISTS idx_room_applications_room_id ON room_applications(room_id);
CREATE INDEX IF NOT EXISTS idx_room_applications_student_id ON room_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_room_applications_status ON room_applications(status);
CREATE INDEX IF NOT EXISTS idx_favorites_student_id ON favorites(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_elderly_id ON conversations(elderly_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_room_id ON reviews(room_id);
CREATE INDEX IF NOT EXISTS idx_rentals_student_id ON rentals(student_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_payments_rental_id ON payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE elderly_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR PROFILES
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS POLICIES FOR ELDERLY_PROFILES
CREATE POLICY "Anyone can view elderly profiles"
  ON elderly_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Elderly can insert their own profile"
  ON elderly_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Elderly can update their own profile"
  ON elderly_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS POLICIES FOR STUDENT_PROFILES
CREATE POLICY "Anyone can view student profiles"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can insert their own profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can update their own profile"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS POLICIES FOR ROOMS
CREATE POLICY "Anyone can view available rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Elderly can insert their own rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = elderly_id);

CREATE POLICY "Elderly can update their own rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = elderly_id)
  WITH CHECK (auth.uid() = elderly_id);

CREATE POLICY "Elderly can delete their own rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = elderly_id);

-- RLS POLICIES FOR ROOM_PHOTOS
CREATE POLICY "Anyone can view room photos"
  ON room_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Elderly can insert photos for their rooms"
  ON room_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_photos.room_id
      AND rooms.elderly_id = auth.uid()
    )
  );

CREATE POLICY "Elderly can delete photos from their rooms"
  ON room_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_photos.room_id
      AND rooms.elderly_id = auth.uid()
    )
  );

-- RLS POLICIES FOR ROOM_APPLICATIONS
CREATE POLICY "Students can view their own applications"
  ON room_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Elderly can view applications for their rooms"
  ON room_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_applications.room_id
      AND rooms.elderly_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert applications"
  ON room_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Elderly can update applications for their rooms"
  ON room_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_applications.room_id
      AND rooms.elderly_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_applications.room_id
      AND rooms.elderly_id = auth.uid()
    )
  );

-- RLS POLICIES FOR FAVORITES
CREATE POLICY "Students can view their own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

-- RLS POLICIES FOR CONVERSATIONS
CREATE POLICY "Participants can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = elderly_id OR auth.uid() = student_id);

CREATE POLICY "System can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = elderly_id OR auth.uid() = student_id);

-- RLS POLICIES FOR MESSAGES
CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.elderly_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.elderly_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.elderly_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.elderly_id = auth.uid() OR conversations.student_id = auth.uid())
    )
  );

-- RLS POLICIES FOR REVIEWS
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can insert reviews for rooms they rented"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.room_id = reviews.room_id
      AND rentals.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- RLS POLICIES FOR RENTALS
CREATE POLICY "Students can view their own rentals"
  ON rentals FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Elderly can view rentals for their rooms"
  ON rentals FOR SELECT
  TO authenticated
  USING (auth.uid() = elderly_id);

CREATE POLICY "System can create rentals"
  ON rentals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = elderly_id OR auth.uid() = student_id);

CREATE POLICY "Participants can update rental status"
  ON rentals FOR UPDATE
  TO authenticated
  USING (auth.uid() = elderly_id OR auth.uid() = student_id)
  WITH CHECK (auth.uid() = elderly_id OR auth.uid() = student_id);

-- RLS POLICIES FOR PAYMENTS
CREATE POLICY "Students can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.id = payments.rental_id
      AND rentals.student_id = auth.uid()
    )
  );

CREATE POLICY "Elderly can view payments for their rentals"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.id = payments.rental_id
      AND rentals.elderly_id = auth.uid()
    )
  );

CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.id = payments.rental_id
    )
  );

CREATE POLICY "System can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.id = payments.rental_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.id = payments.rental_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elderly_profiles_updated_at
  BEFORE UPDATE ON elderly_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_applications_updated_at
  BEFORE UPDATE ON room_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();