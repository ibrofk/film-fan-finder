import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie, Tag, Mood, UserProfile } from '@/types';

interface ProfileContextType {
  profile: UserProfile;
  addLikedMovie: (movie: Movie) => void;
  removeLikedMovie: (movieId: number) => void;
  addDislikedMovie: (movie: Movie) => void;
  removeDislikedMovie: (movieId: number) => void;
  addAvoidedMovie: (movie: Movie) => void;  // Added
  removeAvoidedMovie: (movieId: number) => void;  // Added
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  setCurrentMood: (mood: Mood) => void;
  clearProfile: () => void;
}

const initialProfile: UserProfile = {
  likedMovies: [],
  dislikedMovies: [],
  avoidedMovies: [],  // Added
  tags: [],
  currentMood: undefined,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Try to load from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : initialProfile;
  });

  // Save to localStorage whenever profile changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  const addLikedMovie = (movie: Movie) => {
    setProfile(prev => {
      // Remove from disliked and avoided if it was there
      const filteredDisliked = prev.dislikedMovies.filter(m => m.id !== movie.id);
      const filteredAvoided = prev.avoidedMovies.filter(m => m.id !== movie.id);
      
      // Check if already in liked movies
      const isAlreadyLiked = prev.likedMovies.some(m => m.id === movie.id);
      
      if (isAlreadyLiked) return prev;
      
      return {
        ...prev,
        likedMovies: [...prev.likedMovies, movie],
        dislikedMovies: filteredDisliked,
        avoidedMovies: filteredAvoided
      };
    });
  };

  const removeLikedMovie = (movieId: number) => {
    setProfile(prev => ({
      ...prev,
      likedMovies: prev.likedMovies.filter(m => m.id !== movieId)
    }));
  };

  const addDislikedMovie = (movie: Movie) => {
    setProfile(prev => {
      // Remove from liked and avoided if it was there
      const filteredLiked = prev.likedMovies.filter(m => m.id !== movie.id);
      const filteredAvoided = prev.avoidedMovies.filter(m => m.id !== movie.id);
      
      // Check if already in disliked movies
      const isAlreadyDisliked = prev.dislikedMovies.some(m => m.id === movie.id);
      
      if (isAlreadyDisliked) return prev;
      
      return {
        ...prev,
        dislikedMovies: [...prev.dislikedMovies, movie],
        likedMovies: filteredLiked,
        avoidedMovies: filteredAvoided
      };
    });
  };

  const removeDislikedMovie = (movieId: number) => {
    setProfile(prev => ({
      ...prev,
      dislikedMovies: prev.dislikedMovies.filter(m => m.id !== movieId)
    }));
  };

  const addAvoidedMovie = (movie: Movie) => {
    setProfile(prev => {
      // Remove from liked and disliked if it was there
      const filteredLiked = prev.likedMovies.filter(m => m.id !== movie.id);
      const filteredDisliked = prev.dislikedMovies.filter(m => m.id !== movie.id);
      
      // Check if already in avoided movies
      const isAlreadyAvoided = prev.avoidedMovies.some(m => m.id === movie.id);
      
      if (isAlreadyAvoided) return prev;
      
      return {
        ...prev,
        avoidedMovies: [...prev.avoidedMovies, movie],
        likedMovies: filteredLiked,
        dislikedMovies: filteredDisliked
      };
    });
  };

  const removeAvoidedMovie = (movieId: number) => {
    setProfile(prev => ({
      ...prev,
      avoidedMovies: prev.avoidedMovies.filter(m => m.id !== movieId)
    }));
  };

  const addTag = (tag: Tag) => {
    setProfile(prev => {
      // Check if tag already exists
      const tagExists = prev.tags.some(t => t.id === tag.id);
      if (tagExists) return prev;
      
      return {
        ...prev,
        tags: [...prev.tags, tag]
      };
    });
  };

  const removeTag = (tagId: string) => {
    setProfile(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== tagId)
    }));
  };

  const setCurrentMood = (mood: Mood) => {
    setProfile(prev => ({
      ...prev,
      currentMood: mood
    }));
  };

  const clearProfile = () => {
    setProfile(initialProfile);
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      addLikedMovie,
      removeLikedMovie,
      addDislikedMovie,
      removeDislikedMovie,
      addAvoidedMovie,
      removeAvoidedMovie,
      addTag,
      removeTag,
      setCurrentMood,
      clearProfile
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
