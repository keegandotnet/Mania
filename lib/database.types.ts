// Generated-shape database contract for the committed Supabase migrations.
// Refresh with `npm run db:types` after linking a project or starting Supabase locally.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type RowShape<T> = {
  Row: T;
  Insert: Partial<T> & Record<string, unknown>;
  Update: Partial<T>;
  Relationships: Array<{
    foreignKeyName: string;
    columns: string[];
    isOneToOne: boolean;
    referencedRelation: string;
    referencedColumns: string[];
  }>;
};

export type Database = {
  public: {
    Tables: {
      groups: RowShape<{
        id: string; name: string; created_by: string; invite_code: string; created_at: string;
      }>;
      group_members: RowShape<{
        id: string; group_id: string; user_id: string; player_order: number; joined_at: string;
      }>;
      games: RowShape<{
        id: string; group_id: string; host_id: string; status: string; current_round: number;
        auto_advance: boolean; created_at: string; max_rounds: number;
      }>;
      game_members: RowShape<{
        id: string; game_id: string; user_id: string; player_order: number;
      }>;
      rounds: RowShape<{
        id: string; game_id: string; created_by: string; album_name: string | null;
        artist_name: string | null; album_url: string | null; round_number: number;
        status: string; created_at: string; spotify_album_id: string | null;
        album_cover_url: string | null;
      }>;
      reviews: RowShape<{
        id: string; round_id: string; user_id: string; rating: number;
        review_text: string; created_at: string;
      }>;
      profiles: RowShape<{
        user_id: string; display_name: string | null; created_at: string; updated_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      advance_game: {
        Args: { p_game_id: string };
        Returns: Array<{ round_id: string | null; revealed_round_id: string | null; completed: boolean }>;
      };
      create_game_for_group: { Args: { p_group_id: string }; Returns: string };
      create_group_with_owner: { Args: { p_name: string; p_invite: string }; Returns: string };
      get_game_member_emails: {
        Args: { p_game_id: string };
        Returns: Array<{ user_id: string; display_name: string | null }>;
      };
      get_group_current_game: {
        Args: { p_group_id: string };
        Returns: Array<{
          id: string; status: string; current_round: number; host_id: string;
          max_rounds: number; auto_advance: boolean; is_participant: boolean; player_count: number;
        }>;
      };
      get_group_member_profiles: {
        Args: { p_group_id: string };
        Returns: Array<{
          user_id: string; display_name: string | null; joined_at: string; player_order: number;
        }>;
      };
      join_group_by_invite: { Args: { p_invite: string }; Returns: string };
      leave_group: { Args: { p_group_id: string }; Returns: undefined };
      submit_album: {
        Args: {
          p_game_id: string; p_album_name: string; p_artist_name: string; p_album_url: string;
          p_spotify_album_id?: string | null; p_album_cover_url?: string | null;
        };
        Returns: string;
      };
      submit_review: {
        Args: { p_round_id: string; p_rating: number; p_review_text: string };
        Returns: undefined;
      };
      update_game_auto_advance: {
        Args: { p_game_id: string; p_auto_advance: boolean };
        Returns: undefined;
      };
      update_game_max_rounds: {
        Args: { p_game_id: string; p_max_rounds: number };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
