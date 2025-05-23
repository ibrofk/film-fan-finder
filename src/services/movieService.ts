import axios from 'axios';
import { Movie, Genre, Tag, Mood } from '@/types';

// This is a public API key for demo purposes only
// In a production app, you would store this securely
const API_KEY = '2dca580c2a14b55200e784d157207b4d';
const BASE_URL = 'https://api.themoviedb.org/3';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'en-US',
  }
});

export const getPopularMovies = async (page = 1): Promise<Movie[]> => {
  try {
    const response = await api.get('/movie/popular', {
      params: { page }
    });
    return response.data.results;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
};

export const searchMovies = async (query: string, page = 1): Promise<Movie[]> => {
  if (!query.trim()) return [];
  
  try {
    const response = await api.get('/search/movie', {
      params: { query, page }
    });
    return response.data.results;
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
};

export const getMovieDetails = async (movieId: number): Promise<Movie | null> => {
  try {
    const response = await api.get(`/movie/${movieId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${movieId}:`, error);
    return null;
  }
};

export const getGenres = async (): Promise<Genre[]> => {
  try {
    const response = await api.get('/genre/movie/list');
    return response.data.genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
};

export const getRecommendations = async (movieId: number): Promise<Movie[]> => {
  try {
    const response = await api.get(`/movie/${movieId}/recommendations`);
    return response.data.results;
  } catch (error) {
    console.error(`Error fetching recommendations for movie ID ${movieId}:`, error);
    return [];
  }
};

// Utility to generate movie poster URL
export const getMoviePosterUrl = (posterPath: string | null, size = 'w500'): string => {
  if (!posterPath) return '/placeholder.svg';
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
};

// Function to extract tags from movies
export const extractTagsFromMovies = async (movies: Movie[]): Promise<Tag[]> => {
  // Get all genres first
  const genres = await getGenres();
  
  // Collect all genre IDs from the movies
  const genreMap = new Map<number, number>();
  movies.forEach(movie => {
    if (movie.genre_ids) {
      movie.genre_ids.forEach(genreId => {
        const current = genreMap.get(genreId) || 0;
        genreMap.set(genreId, current + 1);
      });
    } else if (movie.genres) {
      movie.genres.forEach(genre => {
        const current = genreMap.get(genre.id) || 0;
        genreMap.set(genre.id, current + 1);
      });
    }
  });
  
  // Convert to tags, prioritizing the most common genres
  const genreTags: Tag[] = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genreId, count]) => {
      const genre = genres.find(g => g.id === genreId);
      return {
        id: `genre-${genreId}`,
        name: genre?.name || 'Unknown Genre',
        source: 'auto',
        type: 'genre'
      };
    });
  
  // We could add more sophisticated tag extraction here in the future
  // For now, we'll just return genre tags
  return genreTags;
};

// Map mood to genre combinations for recommendations
export const getMoodBasedRecommendations = async (mood: Mood, page = 1): Promise<Movie[]> => {
  try {
    let genreIds: number[] = [];
    
    // Map moods to genre IDs
    switch (mood) {
      case 'happy':
        genreIds = [35, 10751]; // Comedy, Family
        break;
      case 'sad':
        genreIds = [18, 10749]; // Drama, Romance
        break;
      case 'excited':
        genreIds = [28, 12, 878]; // Action, Adventure, Sci-Fi
        break;
      case 'relaxed':
        genreIds = [16, 35, 10751]; // Animation, Comedy, Family
        break;
      case 'thoughtful':
        genreIds = [99, 36, 18]; // Documentary, History, Drama
        break;
      case 'tense':
        genreIds = [27, 53, 9648]; // Horror, Thriller, Mystery
        break;
    }
    
    const genreParam = genreIds.join(',');
    
    const response = await api.get('/discover/movie', {
      params: {
        with_genres: genreParam,
        sort_by: 'popularity.desc',
        page
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error(`Error fetching mood-based recommendations for ${mood}:`, error);
    return [];
  }
};

// Get recommendations based on tags and liked movies
export const getTagBasedRecommendations = async (
  tags: Tag[],
  likedMovieIds: number[],
  dislikedMovieIds: number[],
  avoidedMovieIds: number[] = [], // Added avoided movie IDs parameter
  page = 1
): Promise<Movie[]> => {
  try {
    // Extract genre IDs from tags
    const genreIds = tags
      .filter(tag => tag.type === 'genre')
      .map(tag => parseInt(tag.id.replace('genre-', '')))
      .filter(id => !isNaN(id));
    
    // If no genre IDs or liked movies, return popular movies
    if (genreIds.length === 0 && likedMovieIds.length === 0) {
      return getPopularMovies(page);
    }
    
    // Construct parameters based on available data
    const params: Record<string, any> = {
      page,
      sort_by: 'popularity.desc'
    };
    
    if (genreIds.length > 0) {
      params.with_genres = genreIds.join(',');
    }
    
    // Get recommendations from the API
    const response = await api.get('/discover/movie', { params });
    let results = response.data.results;
    
    // Filter out disliked and avoided movies
    if (dislikedMovieIds.length > 0 || avoidedMovieIds.length > 0) {
      results = results.filter(movie => 
        !dislikedMovieIds.includes(movie.id) && 
        !avoidedMovieIds.includes(movie.id)
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching tag-based recommendations:', error);
    return [];
  }
};
