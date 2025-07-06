-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create links table
CREATE TABLE IF NOT EXISTS public.links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    platform TEXT,
    notes TEXT,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_links junction table
CREATE TABLE IF NOT EXISTS public.collection_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    link_id UUID REFERENCES public.links(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, link_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_platform ON public.links(platform);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON public.links(created_at);
CREATE INDEX IF NOT EXISTS idx_collection_links_collection_id ON public.collection_links(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_links_link_id ON public.collection_links(link_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_links_updated_at
    BEFORE UPDATE ON public.links
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_links ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Collections policies
CREATE POLICY "Users can view own collections" ON public.collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON public.collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own collections" ON public.collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.collections
    FOR DELETE USING (auth.uid() = user_id);

-- Links policies
CREATE POLICY "Users can view own links" ON public.links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links" ON public.links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON public.links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON public.links
    FOR DELETE USING (auth.uid() = user_id);

-- Collection links policies
CREATE POLICY "Users can view own collection links" ON public.collection_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = collection_links.collection_id
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view public collection links" ON public.collection_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = collection_links.collection_id
            AND collections.is_public = true
        )
    );

CREATE POLICY "Users can insert own collection links" ON public.collection_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = collection_links.collection_id
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own collection links" ON public.collection_links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = collection_links.collection_id
            AND collections.user_id = auth.uid()
        )
    );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 