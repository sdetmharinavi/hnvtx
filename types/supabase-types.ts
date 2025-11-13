export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          last_webauthn_challenge_data: Json | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          oauth_client_id: string | null
          refresh_token_counter: number | null
          refresh_token_hmac_key: string | null
          refreshed_at: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: { Args: never; Returns: string }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      uid: { Args: never; Returns: string }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cable_segments: {
        Row: {
          created_at: string | null
          distance_km: number
          end_node_id: string
          end_node_type: string
          fiber_count: number
          id: string
          original_cable_id: string
          segment_order: number
          start_node_id: string
          start_node_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distance_km: number
          end_node_id: string
          end_node_type: string
          fiber_count: number
          id?: string
          original_cable_id: string
          segment_order: number
          start_node_id: string
          start_node_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distance_km?: number
          end_node_id?: string
          end_node_type?: string
          fiber_count?: number
          id?: string
          original_cable_id?: string
          segment_order?: number
          start_node_id?: string
          start_node_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cable_segments_original_cable_id_fkey"
            columns: ["original_cable_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cable_segments_original_cable_id_fkey"
            columns: ["original_cable_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "cable_segments_original_cable_id_fkey"
            columns: ["original_cable_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          note_date: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          note_date?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          note_date?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_profiles_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_designations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_designations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "employee_designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_designations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_employee_designations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          employee_addr: string | null
          employee_contact: string | null
          employee_designation_id: string | null
          employee_dob: string | null
          employee_doj: string | null
          employee_email: string | null
          employee_name: string
          employee_pers_no: string | null
          id: string
          maintenance_terminal_id: string | null
          remark: string | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_addr?: string | null
          employee_contact?: string | null
          employee_designation_id?: string | null
          employee_dob?: string | null
          employee_doj?: string | null
          employee_email?: string | null
          employee_name: string
          employee_pers_no?: string | null
          id?: string
          maintenance_terminal_id?: string | null
          remark?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_addr?: string | null
          employee_contact?: string | null
          employee_designation_id?: string | null
          employee_dob?: string | null
          employee_doj?: string | null
          employee_email?: string | null
          employee_name?: string
          employee_pers_no?: string | null
          id?: string
          maintenance_terminal_id?: string | null
          remark?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_employee_designation_id_fkey"
            columns: ["employee_designation_id"]
            isOneToOne: false
            referencedRelation: "employee_designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_employee_designation_id_fkey"
            columns: ["employee_designation_id"]
            isOneToOne: false
            referencedRelation: "v_employee_designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_splices: {
        Row: {
          created_at: string | null
          id: string
          incoming_fiber_no: number
          incoming_segment_id: string
          jc_id: string
          logical_path_id: string | null
          loss_db: number | null
          outgoing_fiber_no: number | null
          outgoing_segment_id: string | null
          splice_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          incoming_fiber_no: number
          incoming_segment_id: string
          jc_id: string
          logical_path_id?: string | null
          loss_db?: number | null
          outgoing_fiber_no?: number | null
          outgoing_segment_id?: string | null
          splice_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          incoming_fiber_no?: number
          incoming_segment_id?: string
          jc_id?: string
          logical_path_id?: string | null
          loss_db?: number | null
          outgoing_fiber_no?: number | null
          outgoing_segment_id?: string | null
          splice_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_splices_incoming_segment_id_fkey"
            columns: ["incoming_segment_id"]
            isOneToOne: false
            referencedRelation: "cable_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_incoming_segment_id_fkey"
            columns: ["incoming_segment_id"]
            isOneToOne: false
            referencedRelation: "v_cable_segments_at_jc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_jc_id_fkey"
            columns: ["jc_id"]
            isOneToOne: false
            referencedRelation: "junction_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_jc_id_fkey"
            columns: ["jc_id"]
            isOneToOne: false
            referencedRelation: "v_junction_closures_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "logical_fiber_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "v_end_to_end_paths"
            referencedColumns: ["path_id"]
          },
          {
            foreignKeyName: "fiber_splices_outgoing_segment_id_fkey"
            columns: ["outgoing_segment_id"]
            isOneToOne: false
            referencedRelation: "cable_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_outgoing_segment_id_fkey"
            columns: ["outgoing_segment_id"]
            isOneToOne: false
            referencedRelation: "v_cable_segments_at_jc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_splice_type_id_fkey"
            columns: ["splice_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_splices_splice_type_id_fkey"
            columns: ["splice_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          file_name: string
          file_route: string
          file_size: string
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          file_name: string
          file_route: string
          file_size: string
          file_type: string
          file_url: string
          folder_id?: string | null
          id?: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          file_name?: string
          file_route?: string
          file_size?: string
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_profiles_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_profiles_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          asset_no: string | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          functional_location_id: string | null
          id: string
          location_id: string | null
          name: string
          purchase_date: string | null
          quantity: number
          status_id: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          asset_no?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          functional_location_id?: string | null
          id?: string
          location_id?: string | null
          name: string
          purchase_date?: string | null
          quantity?: number
          status_id?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          asset_no?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          functional_location_id?: string | null
          id?: string
          location_id?: string | null
          name?: string
          purchase_date?: string | null
          quantity?: number
          status_id?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_functional_location_id_fkey"
            columns: ["functional_location_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_functional_location_id_fkey"
            columns: ["functional_location_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      junction_closures: {
        Row: {
          created_at: string | null
          id: string
          node_id: string
          ofc_cable_id: string
          position_km: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          node_id: string
          ofc_cable_id: string
          position_km?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          node_id?: string
          ofc_cable_id?: string
          position_km?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "junction_closures_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      logical_fiber_paths: {
        Row: {
          bandwidth_gbps: number | null
          commissioned_date: string | null
          created_at: string | null
          destination_port: string | null
          destination_system_id: string | null
          id: string
          operational_status_id: string | null
          path_name: string | null
          path_role: string
          path_type_id: string | null
          remark: string | null
          service_type: string | null
          source_port: string | null
          source_system_id: string | null
          total_distance_km: number | null
          total_loss_db: number | null
          updated_at: string | null
          wavelength_nm: number | null
          working_path_id: string | null
        }
        Insert: {
          bandwidth_gbps?: number | null
          commissioned_date?: string | null
          created_at?: string | null
          destination_port?: string | null
          destination_system_id?: string | null
          id?: string
          operational_status_id?: string | null
          path_name?: string | null
          path_role?: string
          path_type_id?: string | null
          remark?: string | null
          service_type?: string | null
          source_port?: string | null
          source_system_id?: string | null
          total_distance_km?: number | null
          total_loss_db?: number | null
          updated_at?: string | null
          wavelength_nm?: number | null
          working_path_id?: string | null
        }
        Update: {
          bandwidth_gbps?: number | null
          commissioned_date?: string | null
          created_at?: string | null
          destination_port?: string | null
          destination_system_id?: string | null
          id?: string
          operational_status_id?: string | null
          path_name?: string | null
          path_role?: string
          path_type_id?: string | null
          remark?: string | null
          service_type?: string | null
          source_port?: string | null
          source_system_id?: string | null
          total_distance_km?: number | null
          total_loss_db?: number | null
          updated_at?: string | null
          wavelength_nm?: number | null
          working_path_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lfp_destination_system"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lfp_destination_system"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lfp_source_system"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lfp_source_system"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_operational_status_id_fkey"
            columns: ["operational_status_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_operational_status_id_fkey"
            columns: ["operational_status_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_path_type_id_fkey"
            columns: ["path_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_path_type_id_fkey"
            columns: ["path_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_working_path_id_fkey"
            columns: ["working_path_id"]
            isOneToOne: false
            referencedRelation: "logical_fiber_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_working_path_id_fkey"
            columns: ["working_path_id"]
            isOneToOne: false
            referencedRelation: "v_end_to_end_paths"
            referencedColumns: ["path_id"]
          },
        ]
      }
      logical_path_segments: {
        Row: {
          created_at: string | null
          id: string
          logical_path_id: string
          ofc_cable_id: string | null
          path_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logical_path_id: string
          ofc_cable_id?: string | null
          path_order: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logical_path_id?: string
          ofc_cable_id?: string | null
          path_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logical_path_segments_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "logical_fiber_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_path_segments_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "v_end_to_end_paths"
            referencedColumns: ["path_id"]
          },
          {
            foreignKeyName: "logical_path_segments_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_path_segments_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "logical_path_segments_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      logical_paths: {
        Row: {
          created_at: string | null
          end_node_id: string | null
          id: string
          name: string
          ring_id: string | null
          start_node_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_node_id?: string | null
          id?: string
          name: string
          ring_id?: string | null
          start_node_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_node_id?: string | null
          id?: string
          name?: string
          ring_id?: string | null
          start_node_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logical_paths_end_node_id_fkey"
            columns: ["end_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_paths_end_node_id_fkey"
            columns: ["end_node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_paths_end_node_id_fkey"
            columns: ["end_node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_paths_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "rings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_paths_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["ring_id"]
          },
          {
            foreignKeyName: "logical_paths_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "v_rings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_paths_start_node_id_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_paths_start_node_id_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_paths_start_node_id_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_types: {
        Row: {
          category: string
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_ring_based: boolean | null
          is_system_default: boolean | null
          name: string
          sort_order: number | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_ring_based?: boolean | null
          is_system_default?: boolean | null
          name: string
          sort_order?: number | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_ring_based?: boolean | null
          is_system_default?: boolean | null
          name?: string
          sort_order?: number | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_areas: {
        Row: {
          address: string | null
          area_type_id: string | null
          code: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          parent_id: string | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area_type_id?: string | null
          code?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          parent_id?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          area_type_id?: string | null
          code?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          parent_id?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_areas_area_type_id_fkey"
            columns: ["area_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_area_type_id_fkey"
            columns: ["area_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          maintenance_terminal_id: string | null
          name: string
          node_type_id: string | null
          remark: string | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          maintenance_terminal_id?: string | null
          name: string
          node_type_id?: string | null
          remark?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          maintenance_terminal_id?: string | null
          name?: string
          node_type_id?: string | null
          remark?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nodes_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_node_type_id_fkey"
            columns: ["node_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_node_type_id_fkey"
            columns: ["node_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ofc_cables: {
        Row: {
          asset_no: string | null
          capacity: number
          commissioned_on: string | null
          created_at: string | null
          current_rkm: number | null
          en_id: string
          id: string
          maintenance_terminal_id: string | null
          ofc_owner_id: string
          ofc_type_id: string
          remark: string | null
          route_name: string
          sn_id: string
          status: boolean | null
          transnet_id: string | null
          transnet_rkm: number | null
          updated_at: string | null
        }
        Insert: {
          asset_no?: string | null
          capacity: number
          commissioned_on?: string | null
          created_at?: string | null
          current_rkm?: number | null
          en_id: string
          id?: string
          maintenance_terminal_id?: string | null
          ofc_owner_id: string
          ofc_type_id: string
          remark?: string | null
          route_name: string
          sn_id: string
          status?: boolean | null
          transnet_id?: string | null
          transnet_rkm?: number | null
          updated_at?: string | null
        }
        Update: {
          asset_no?: string | null
          capacity?: number
          commissioned_on?: string | null
          created_at?: string | null
          current_rkm?: number | null
          en_id?: string
          id?: string
          maintenance_terminal_id?: string | null
          ofc_owner_id?: string
          ofc_type_id?: string
          remark?: string | null
          route_name?: string
          sn_id?: string
          status?: boolean | null
          transnet_id?: string | null
          transnet_rkm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_owner_id_fkey"
            columns: ["ofc_owner_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_owner_id_fkey"
            columns: ["ofc_owner_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_type_id_fkey"
            columns: ["ofc_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_type_id_fkey"
            columns: ["ofc_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ofc_connections: {
        Row: {
          connection_category: string
          connection_type: string
          created_at: string | null
          destination_port: string | null
          en_dom: string | null
          en_power_dbm: number | null
          fiber_no_en: number
          fiber_no_sn: number
          fiber_role: string | null
          id: string
          logical_path_id: string | null
          ofc_id: string
          otdr_distance_en_km: number | null
          otdr_distance_sn_km: number | null
          path_segment_order: number | null
          remark: string | null
          route_loss_db: number | null
          sn_dom: string | null
          sn_power_dbm: number | null
          source_port: string | null
          status: boolean | null
          system_id: string | null
          updated_at: string | null
          updated_en_id: string | null
          updated_fiber_no_en: number | null
          updated_fiber_no_sn: number | null
          updated_sn_id: string | null
        }
        Insert: {
          connection_category?: string
          connection_type?: string
          created_at?: string | null
          destination_port?: string | null
          en_dom?: string | null
          en_power_dbm?: number | null
          fiber_no_en: number
          fiber_no_sn: number
          fiber_role?: string | null
          id?: string
          logical_path_id?: string | null
          ofc_id: string
          otdr_distance_en_km?: number | null
          otdr_distance_sn_km?: number | null
          path_segment_order?: number | null
          remark?: string | null
          route_loss_db?: number | null
          sn_dom?: string | null
          sn_power_dbm?: number | null
          source_port?: string | null
          status?: boolean | null
          system_id?: string | null
          updated_at?: string | null
          updated_en_id?: string | null
          updated_fiber_no_en?: number | null
          updated_fiber_no_sn?: number | null
          updated_sn_id?: string | null
        }
        Update: {
          connection_category?: string
          connection_type?: string
          created_at?: string | null
          destination_port?: string | null
          en_dom?: string | null
          en_power_dbm?: number | null
          fiber_no_en?: number
          fiber_no_sn?: number
          fiber_role?: string | null
          id?: string
          logical_path_id?: string | null
          ofc_id?: string
          otdr_distance_en_km?: number | null
          otdr_distance_sn_km?: number | null
          path_segment_order?: number | null
          remark?: string | null
          route_loss_db?: number | null
          sn_dom?: string | null
          sn_power_dbm?: number | null
          source_port?: string | null
          status?: boolean | null
          system_id?: string | null
          updated_at?: string | null
          updated_en_id?: string | null
          updated_fiber_no_en?: number | null
          updated_fiber_no_sn?: number | null
          updated_sn_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["system_category", "node_type_name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["system_category", "system_type_name"]
          },
          {
            foreignKeyName: "fk_ofc_connections_logical_path"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "logical_fiber_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ofc_connections_logical_path"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "v_end_to_end_paths"
            referencedColumns: ["path_id"]
          },
          {
            foreignKeyName: "fk_ofc_connections_system"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ofc_connections_system"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_ofc_id_fkey"
            columns: ["ofc_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_ofc_id_fkey"
            columns: ["ofc_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "ofc_connections_ofc_id_fkey"
            columns: ["ofc_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_en_id_fkey"
            columns: ["updated_en_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_en_id_fkey"
            columns: ["updated_en_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_en_id_fkey"
            columns: ["updated_en_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_sn_id_fkey"
            columns: ["updated_sn_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_sn_id_fkey"
            columns: ["updated_sn_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_sn_id_fkey"
            columns: ["updated_sn_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ports_management: {
        Row: {
          bandwidth_allocated_mbps: number | null
          customer_name: string | null
          fiber_in: number | null
          fiber_out: number | null
          port: string | null
          port_capacity: string | null
          port_type_id: string | null
          sfp_serial_no: string | null
          system_connection_id: string
        }
        Insert: {
          bandwidth_allocated_mbps?: number | null
          customer_name?: string | null
          fiber_in?: number | null
          fiber_out?: number | null
          port?: string | null
          port_capacity?: string | null
          port_type_id?: string | null
          sfp_serial_no?: string | null
          system_connection_id: string
        }
        Update: {
          bandwidth_allocated_mbps?: number | null
          customer_name?: string | null
          fiber_in?: number | null
          fiber_out?: number | null
          port?: string | null
          port_capacity?: string | null
          port_type_id?: string | null
          sfp_serial_no?: string | null
          system_connection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ports_management_port_type_id_fkey"
            columns: ["port_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ports_management_port_type_id_fkey"
            columns: ["port_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ports_management_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "system_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ports_management_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "v_system_connections_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      ring_based_systems: {
        Row: {
          maintenance_area_id: string | null
          order_in_ring: number | null
          ring_id: string
          system_id: string
        }
        Insert: {
          maintenance_area_id?: string | null
          order_in_ring?: number | null
          ring_id: string
          system_id: string
        }
        Update: {
          maintenance_area_id?: string | null
          order_in_ring?: number | null
          ring_id?: string
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ring_based_systems_maintenance_area_id_fkey"
            columns: ["maintenance_area_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ring_based_systems_maintenance_area_id_fkey"
            columns: ["maintenance_area_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ring_based_systems_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "rings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ring_based_systems_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["ring_id"]
          },
          {
            foreignKeyName: "ring_based_systems_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "v_rings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ring_based_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ring_based_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      rings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          maintenance_terminal_id: string | null
          name: string
          ring_type_id: string | null
          status: boolean | null
          total_nodes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_terminal_id?: string | null
          name: string
          ring_type_id?: string | null
          status?: boolean | null
          total_nodes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_terminal_id?: string | null
          name?: string
          ring_type_id?: string | null
          status?: boolean | null
          total_nodes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rings_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rings_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rings_ring_type_id_fkey"
            columns: ["ring_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rings_ring_type_id_fkey"
            columns: ["ring_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sdh_connections: {
        Row: {
          a_customer: string | null
          a_slot: string | null
          b_customer: string | null
          b_slot: string | null
          carrier: string | null
          stm_no: string | null
          system_connection_id: string
        }
        Insert: {
          a_customer?: string | null
          a_slot?: string | null
          b_customer?: string | null
          b_slot?: string | null
          carrier?: string | null
          stm_no?: string | null
          system_connection_id: string
        }
        Update: {
          a_customer?: string | null
          a_slot?: string | null
          b_customer?: string | null
          b_slot?: string | null
          carrier?: string | null
          stm_no?: string | null
          system_connection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdh_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "system_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdh_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "v_system_connections_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      system_connections: {
        Row: {
          bandwidth_mbps: number | null
          commissioned_on: string | null
          connected_system_type_id: string | null
          created_at: string | null
          en_id: string | null
          en_interface: string | null
          en_ip: unknown
          id: string
          media_type_id: string | null
          remark: string | null
          sn_id: string | null
          sn_interface: string | null
          sn_ip: unknown
          status: boolean | null
          system_id: string
          updated_at: string | null
          vlan: string | null
        }
        Insert: {
          bandwidth_mbps?: number | null
          commissioned_on?: string | null
          connected_system_type_id?: string | null
          created_at?: string | null
          en_id?: string | null
          en_interface?: string | null
          en_ip?: unknown
          id?: string
          media_type_id?: string | null
          remark?: string | null
          sn_id?: string | null
          sn_interface?: string | null
          sn_ip?: unknown
          status?: boolean | null
          system_id: string
          updated_at?: string | null
          vlan?: string | null
        }
        Update: {
          bandwidth_mbps?: number | null
          commissioned_on?: string | null
          connected_system_type_id?: string | null
          created_at?: string | null
          en_id?: string | null
          en_interface?: string | null
          en_ip?: unknown
          id?: string
          media_type_id?: string | null
          remark?: string | null
          sn_id?: string | null
          sn_interface?: string | null
          sn_ip?: unknown
          status?: boolean | null
          system_id?: string
          updated_at?: string | null
          vlan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_connections_connected_system_type_id_fkey"
            columns: ["connected_system_type_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_connected_system_type_id_fkey"
            columns: ["connected_system_type_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_media_type_id_fkey"
            columns: ["media_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_media_type_id_fkey"
            columns: ["media_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          commissioned_on: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          is_hub: boolean | null
          maan_node_id: string | null
          maintenance_terminal_id: string | null
          make: string | null
          node_id: string
          remark: string | null
          s_no: string | null
          status: boolean | null
          system_name: string | null
          system_type_id: string
          updated_at: string | null
        }
        Insert: {
          commissioned_on?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_hub?: boolean | null
          maan_node_id?: string | null
          maintenance_terminal_id?: string | null
          make?: string | null
          node_id: string
          remark?: string | null
          s_no?: string | null
          status?: boolean | null
          system_name?: string | null
          system_type_id: string
          updated_at?: string | null
        }
        Update: {
          commissioned_on?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_hub?: boolean | null
          maan_node_id?: string | null
          maintenance_terminal_id?: string | null
          make?: string | null
          node_id?: string
          remark?: string | null
          s_no?: string | null
          status?: boolean | null
          system_name?: string | null
          system_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "systems_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_system_type_id_fkey"
            columns: ["system_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_system_type_id_fkey"
            columns: ["system_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          designation: string | null
          first_name: string
          id: string
          last_name: string
          phone_number: string | null
          preferences: Json | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          designation?: string | null
          first_name: string
          id: string
          last_name: string
          phone_number?: string | null
          preferences?: Json | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          designation?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string | null
          preferences?: Json | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_user_profiles_extended"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_cable_segments_at_jc: {
        Row: {
          end_node_id: string | null
          fiber_count: number | null
          id: string | null
          jc_node_id: string | null
          original_cable_id: string | null
          segment_order: number | null
          start_node_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cable_segments_original_cable_id_fkey"
            columns: ["original_cable_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cable_segments_original_cable_id_fkey"
            columns: ["original_cable_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "cable_segments_original_cable_id_fkey"
            columns: ["original_cable_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["jc_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["jc_node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["jc_node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cable_utilization: {
        Row: {
          available_fibers: number | null
          cable_id: string | null
          capacity: number | null
          route_name: string | null
          used_fibers: number | null
          utilization_percent: number | null
        }
        Relationships: []
      }
      v_employee_designations: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          parent_id: string | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_designations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "employee_designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_designations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_employee_designations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_employees: {
        Row: {
          created_at: string | null
          employee_addr: string | null
          employee_contact: string | null
          employee_designation_id: string | null
          employee_designation_name: string | null
          employee_dob: string | null
          employee_doj: string | null
          employee_email: string | null
          employee_name: string | null
          employee_pers_no: string | null
          id: string | null
          maintenance_area_name: string | null
          maintenance_terminal_id: string | null
          remark: string | null
          status: boolean | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_employee_designation_id_fkey"
            columns: ["employee_designation_id"]
            isOneToOne: false
            referencedRelation: "employee_designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_employee_designation_id_fkey"
            columns: ["employee_designation_id"]
            isOneToOne: false
            referencedRelation: "v_employee_designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_end_to_end_paths: {
        Row: {
          destination_system_id: string | null
          operational_status: string | null
          path_id: string | null
          path_name: string | null
          route_names: string | null
          segment_count: number | null
          source_system_id: string | null
          total_distance_km: number | null
          total_loss_db: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lfp_destination_system"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lfp_destination_system"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lfp_source_system"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lfp_source_system"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      v_inventory_items: {
        Row: {
          asset_no: string | null
          category_id: string | null
          category_name: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          functional_location: string | null
          functional_location_id: string | null
          id: string | null
          location_id: string | null
          name: string | null
          purchase_date: string | null
          quantity: number | null
          status_id: string | null
          status_name: string | null
          store_location: string | null
          updated_at: string | null
          vendor: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_functional_location_id_fkey"
            columns: ["functional_location_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_functional_location_id_fkey"
            columns: ["functional_location_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      v_junction_closures_complete: {
        Row: {
          id: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          node_id: string | null
          ofc_cable_id: string | null
          position_km: number | null
        }
        Relationships: [
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junction_closures_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "junction_closures_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      v_lookup_types: {
        Row: {
          category: string | null
          code: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_ring_based: boolean | null
          is_system_default: boolean | null
          name: string | null
          sort_order: number | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_ring_based?: boolean | null
          is_system_default?: boolean | null
          name?: string | null
          sort_order?: number | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_ring_based?: boolean | null
          is_system_default?: boolean | null
          name?: string | null
          sort_order?: number | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_maintenance_areas: {
        Row: {
          address: string | null
          area_type_id: string | null
          code: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          maintenance_area_type_code: string | null
          maintenance_area_type_name: string | null
          name: string | null
          parent_id: string | null
          status: boolean | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_areas_area_type_id_fkey"
            columns: ["area_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_area_type_id_fkey"
            columns: ["area_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_nodes_complete: {
        Row: {
          created_at: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          maintenance_area_name: string | null
          maintenance_terminal_id: string | null
          name: string | null
          node_type_code: string | null
          node_type_id: string | null
          node_type_name: string | null
          remark: string | null
          status: boolean | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nodes_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_node_type_id_fkey"
            columns: ["node_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_node_type_id_fkey"
            columns: ["node_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ofc_cables_complete: {
        Row: {
          asset_no: string | null
          capacity: number | null
          commissioned_on: string | null
          created_at: string | null
          current_rkm: number | null
          en_id: string | null
          en_name: string | null
          en_node_type_name: string | null
          id: string | null
          maintenance_area_code: string | null
          maintenance_area_name: string | null
          maintenance_terminal_id: string | null
          ofc_owner_code: string | null
          ofc_owner_id: string | null
          ofc_owner_name: string | null
          ofc_type_code: string | null
          ofc_type_id: string | null
          ofc_type_name: string | null
          remark: string | null
          route_name: string | null
          sn_id: string | null
          sn_name: string | null
          sn_node_type_name: string | null
          status: boolean | null
          transnet_id: string | null
          transnet_rkm: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_owner_id_fkey"
            columns: ["ofc_owner_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_owner_id_fkey"
            columns: ["ofc_owner_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_type_id_fkey"
            columns: ["ofc_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_ofc_type_id_fkey"
            columns: ["ofc_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ofc_connections_complete: {
        Row: {
          connection_category: string | null
          connection_type: string | null
          created_at: string | null
          destination_port: string | null
          en_dom: string | null
          en_id: string | null
          en_name: string | null
          en_power_dbm: number | null
          fiber_no_en: number | null
          fiber_no_sn: number | null
          fiber_role: string | null
          id: string | null
          logical_path_id: string | null
          maintenance_area_name: string | null
          ofc_id: string | null
          ofc_route_name: string | null
          ofc_type_name: string | null
          otdr_distance_en_km: number | null
          otdr_distance_sn_km: number | null
          path_segment_order: number | null
          remark: string | null
          route_loss_db: number | null
          sn_dom: string | null
          sn_id: string | null
          sn_name: string | null
          sn_power_dbm: number | null
          source_port: string | null
          status: boolean | null
          system_id: string | null
          system_name: string | null
          updated_at: string | null
          updated_en_id: string | null
          updated_en_name: string | null
          updated_fiber_no_en: number | null
          updated_fiber_no_sn: number | null
          updated_sn_id: string | null
          updated_sn_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["system_category", "node_type_name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["system_category", "system_type_name"]
          },
          {
            foreignKeyName: "fk_ofc_connections_logical_path"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "logical_fiber_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ofc_connections_logical_path"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "v_end_to_end_paths"
            referencedColumns: ["path_id"]
          },
          {
            foreignKeyName: "fk_ofc_connections_system"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ofc_connections_system"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_ofc_id_fkey"
            columns: ["ofc_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_ofc_id_fkey"
            columns: ["ofc_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "ofc_connections_ofc_id_fkey"
            columns: ["ofc_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_en_id_fkey"
            columns: ["updated_en_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_en_id_fkey"
            columns: ["updated_en_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_en_id_fkey"
            columns: ["updated_en_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_sn_id_fkey"
            columns: ["updated_sn_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_sn_id_fkey"
            columns: ["updated_sn_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_connections_updated_sn_id_fkey"
            columns: ["updated_sn_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ring_nodes: {
        Row: {
          id: string | null
          ip: string | null
          is_hub: boolean | null
          lat: number | null
          long: number | null
          name: string | null
          order_in_ring: number | null
          remark: string | null
          ring_id: string | null
          ring_name: string | null
          ring_status: boolean | null
          system_node_name: string | null
          system_status: boolean | null
          system_type: string | null
          system_type_code: string | null
          type: string | null
        }
        Relationships: []
      }
      v_rings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          maintenance_area_name: string | null
          maintenance_terminal_id: string | null
          name: string | null
          ring_type_code: string | null
          ring_type_id: string | null
          ring_type_name: string | null
          status: boolean | null
          total_nodes: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rings_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rings_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rings_ring_type_id_fkey"
            columns: ["ring_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rings_ring_type_id_fkey"
            columns: ["ring_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      v_system_connections_complete: {
        Row: {
          bandwidth_allocated_mbps: number | null
          bandwidth_mbps: number | null
          commissioned_on: string | null
          connected_system_type_id: string | null
          connected_system_name: string | null
          connected_system_type_name: string | null
          created_at: string | null
          customer_name: string | null
          en_id: string | null
          en_interface: string | null
          en_ip: unknown
          en_name: string | null
          en_node_name: string | null
          fiber_in: number | null
          fiber_out: number | null
          id: string | null
          media_type_id: string | null
          media_type_name: string | null
          port: string | null
          port_capacity: string | null
          port_type_id: string | null
          port_type_name: string | null
          remark: string | null
          sdh_a_customer: string | null
          sdh_a_slot: string | null
          sdh_b_customer: string | null
          sdh_b_slot: string | null
          sdh_carrier: string | null
          sdh_stm_no: string | null
          sfp_serial_no: string | null
          sn_id: string | null
          sn_interface: string | null
          sn_ip: unknown
          sn_name: string | null
          sn_node_name: string | null
          status: boolean | null
          system_id: string | null
          system_name: string | null
          system_type_name: string | null
          updated_at: string | null
          vlan: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ports_management_port_type_id_fkey"
            columns: ["port_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ports_management_port_type_id_fkey"
            columns: ["port_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_connected_system_type_id_fkey"
            columns: ["connected_system_type_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_connected_system_type_id_fkey"
            columns: ["connected_system_type_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_en_id_fkey"
            columns: ["en_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_media_type_id_fkey"
            columns: ["media_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_media_type_id_fkey"
            columns: ["media_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_sn_id_fkey"
            columns: ["sn_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      v_system_ring_paths_detailed: {
        Row: {
          created_at: string | null
          end_node_id: string | null
          end_node_name: string | null
          id: string | null
          logical_path_id: string | null
          ofc_cable_id: string | null
          path_name: string | null
          path_order: number | null
          route_name: string | null
          source_system_id: string | null
          start_node_id: string | null
          start_node_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lfp_source_system"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lfp_source_system"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_path_segments_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "logical_fiber_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_path_segments_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "v_end_to_end_paths"
            referencedColumns: ["path_id"]
          },
          {
            foreignKeyName: "logical_path_segments_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_path_segments_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "logical_path_segments_ofc_cable_id_fkey"
            columns: ["ofc_cable_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["end_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["end_node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_en_id_fkey"
            columns: ["end_node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofc_cables_sn_id_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_systems_complete: {
        Row: {
          commissioned_on: string | null
          created_at: string | null
          id: string | null
          ip_address: unknown
          is_hub: boolean | null
          is_ring_based: boolean | null
          latitude: number | null
          longitude: number | null
          maan_node_id: string | null
          maintenance_terminal_id: string | null
          make: string | null
          node_id: string | null
          node_name: string | null
          node_type_name: string | null
          order_in_ring: number | null
          remark: string | null
          ring_associations: Json | null
          ring_id: string | null
          ring_logical_area_name: string | null
          s_no: string | null
          status: boolean | null
          system_category: string | null
          system_maintenance_terminal_name: string | null
          system_name: string | null
          system_type_code: string | null
          system_type_id: string | null
          system_type_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "systems_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_maintenance_terminal_id_fkey"
            columns: ["maintenance_terminal_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_ring_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_system_type_id_fkey"
            columns: ["system_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "systems_system_type_id_fkey"
            columns: ["system_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_profiles_extended: {
        Row: {
          account_age_days: number | null
          address: Json | null
          auth_updated_at: string | null
          avatar_url: string | null
          computed_status: string | null
          created_at: string | null
          date_of_birth: string | null
          designation: string | null
          email: string | null
          email_confirmed_at: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_email_verified: boolean | null
          is_phone_verified: boolean | null
          is_super_admin: boolean | null
          last_activity_period: string | null
          last_name: string | null
          last_sign_in_at: string | null
          phone_confirmed_at: string | null
          phone_number: string | null
          preferences: Json | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_junction_closure: {
        Args: {
          p_node_id: string
          p_ofc_cable_id: string
          p_position_km: number
        }
        Returns: {
          created_at: string
          id: string
          node_id: string
          ofc_cable_id: string
          position_km: number
        }[]
      }
      add_lookup_type: {
        Args: {
          p_category: string
          p_code?: string
          p_description?: string
          p_name: string
          p_sort_order?: number
        }
        Returns: string
      }
      admin_bulk_delete_users: {
        Args: { user_ids: string[] }
        Returns: boolean
      }
      admin_bulk_update_role: {
        Args: { new_role: string; user_ids: string[] }
        Returns: boolean
      }
      admin_bulk_update_status: {
        Args: { new_status: string; user_ids: string[] }
        Returns: boolean
      }
      admin_get_all_users_extended: {
        Args: {
          date_from?: string
          date_to?: string
          filter_activity?: string
          filter_role?: string
          filter_status?: string
          page_limit?: number
          page_offset?: number
          search_query?: string
        }
        Returns: Json
      }
      admin_get_user_by_id: {
        Args: { user_id: string }
        Returns: {
          address: Json
          avatar_url: string
          created_at: string
          date_of_birth: string
          designation: string
          email: string
          first_name: string
          id: string
          is_email_verified: boolean
          last_name: string
          last_sign_in_at: string
          phone_number: string
          preferences: Json
          role: string
          status: string
          updated_at: string
        }[]
      }
      admin_update_user_profile: {
        Args: {
          update_address?: Json
          update_avatar_url?: string
          update_date_of_birth?: string
          update_designation?: string
          update_first_name?: string
          update_last_name?: string
          update_phone_number?: string
          update_preferences?: Json
          update_role?: string
          update_status?: string
          user_id: string
        }
        Returns: boolean
      }
      aggregate_query: {
        Args: {
          aggregation_options: Json
          filters?: Json
          order_by?: Json
          table_name: string
        }
        Returns: {
          result: Json
        }[]
      }
      apply_logical_path_update: {
        Args: {
          p_end_fiber_no: number
          p_end_node_id: string
          p_id: string
          p_start_fiber_no: number
          p_start_node_id: string
        }
        Returns: undefined
      }
      assign_system_to_fibers: {
        Args: {
          p_cable_id: string
          p_fiber_rx: number
          p_fiber_tx: number
          p_logical_path_id: string
          p_system_id: string
        }
        Returns: undefined
      }
      auto_splice_straight_segments: {
        Args: {
          p_jc_id: string
          p_loss_db?: number
          p_segment1_id: string
          p_segment2_id: string
        }
        Returns: Json
      }
      build_where_clause: {
        Args: { p_alias?: string; p_filters: Json; p_view_name: string }
        Returns: string
      }
      bulk_update: {
        Args: { p_table_name: string; p_updates: Json }
        Returns: Json
      }
      column_exists: {
        Args: {
          p_column_name: string
          p_schema_name: string
          p_table_name: string
        }
        Returns: boolean
      }
      deprovision_logical_path: {
        Args: { p_path_id: string }
        Returns: undefined
      }
      disassociate_system_from_ring: {
        Args: { p_ring_id: string; p_system_id: string }
        Returns: undefined
      }
      execute_sql: { Args: { sql_query: string }; Returns: Json }
      find_cable_between_nodes: {
        Args: { p_node1_id: string; p_node2_id: string }
        Returns: {
          id: string
          route_name: string
        }[]
      }
      generate_ring_connection_paths: {
        Args: { p_ring_id: string }
        Returns: {
          created_at: string | null
          end_node_id: string | null
          id: string
          name: string
          ring_id: string | null
          start_node_id: string | null
          status: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "logical_paths"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_all_splices: {
        Args: never
        Returns: {
          incoming_fiber_no: number
          incoming_segment_id: string
          jc_id: string
          jc_name: string
          jc_position_km: number
          loss_db: number
          outgoing_fiber_no: number
          outgoing_segment_id: string
          splice_id: string
        }[]
      }
      get_available_cables_for_node: {
        Args: { p_node_id: string }
        Returns: {
          asset_no: string | null
          capacity: number
          commissioned_on: string | null
          created_at: string | null
          current_rkm: number | null
          en_id: string
          id: string
          maintenance_terminal_id: string | null
          ofc_owner_id: string
          ofc_type_id: string
          remark: string | null
          route_name: string
          sn_id: string
          status: boolean | null
          transnet_id: string | null
          transnet_rkm: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "ofc_cables"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_available_fibers_for_cable: {
        Args: { p_cable_id: string }
        Returns: {
          fiber_no: number
        }[]
      }
      get_bsnl_dashboard_data: {
        Args: {
          p_cable_types?: string[]
          p_max_lat?: number
          p_max_lng?: number
          p_min_lat?: number
          p_min_lng?: number
          p_node_types?: string[]
          p_query?: string
          p_regions?: string[]
          p_status?: boolean
          p_system_types?: string[]
        }
        Returns: Json
      }
      get_continuous_available_fibers: {
        Args: { p_path_id: string }
        Returns: {
          fiber_no: number
        }[]
      }
      get_dashboard_overview: { Args: never; Returns: Json }
      get_diary_notes_for_range: {
        Args: { end_date: string; start_date: string }
        Returns: {
          content: string
          created_at: string
          full_name: string
          id: string
          note_date: string
          tags: string[]
          updated_at: string
          user_id: string
        }[]
      }
      get_entity_counts: {
        Args: { p_entity_name: string; p_filters?: Json }
        Returns: {
          active_count: number
          inactive_count: number
          total_count: number
        }[]
      }
      get_jc_splicing_details: { Args: { p_jc_id: string }; Returns: Json }
      get_lookup_type_id: {
        Args: { p_category: string; p_name: string }
        Returns: string
      }
      get_lookup_types_by_category: {
        Args: { p_category: string }
        Returns: {
          code: string
          description: string
          id: string
          name: string
          sort_order: number
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_my_user_details: {
        Args: never
        Returns: {
          address: Json
          avatar_url: string
          created_at: string
          date_of_birth: string
          designation: string
          email: string
          first_name: string
          id: string
          is_email_verified: boolean
          is_super_admin: boolean
          last_name: string
          last_sign_in_at: string
          phone_number: string
          preferences: Json
          role: string
          updated_at: string
        }[]
      }
      get_paged_data: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
          p_view_name: string
          row_limit?: number
        }
        Returns: Json
      }
      get_rings_for_export: {
        Args: { order_by?: string; row_limit?: number }
        Returns: {
          associated_systems: Json
          description: string
          id: string
          maintenance_area_name: string
          name: string
          ring_type_name: string
          status: boolean
          total_nodes: number
        }[]
      }
      get_route_topology_for_export: {
        Args: { p_route_id: string }
        Returns: Json
      }
      get_segments_at_jc: {
        Args: { p_jc_id: string }
        Returns: {
          fiber_count: number
          id: string
          original_cable_name: string
          segment_order: number
        }[]
      }
      get_system_path_details: {
        Args: { p_path_id: string }
        Returns: {
          created_at: string | null
          end_node_id: string | null
          end_node_name: string | null
          id: string | null
          logical_path_id: string | null
          ofc_cable_id: string | null
          path_name: string | null
          path_order: number | null
          route_name: string | null
          source_system_id: string | null
          start_node_id: string | null
          start_node_name: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "v_system_ring_paths_detailed"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_unique_values: {
        Args: {
          p_column_name: string
          p_filters?: Json
          p_limit_count?: number
          p_order_by?: Json
          p_table_name: string
        }
        Returns: {
          value: Json
        }[]
      }
      is_super_admin: { Args: never; Returns: boolean }
      manage_splice: {
        Args: {
          p_action: string
          p_incoming_fiber_no?: number
          p_incoming_segment_id?: string
          p_jc_id: string
          p_loss_db?: number
          p_outgoing_fiber_no?: number
          p_outgoing_segment_id?: string
          p_splice_id?: string
          p_splice_type_id?: string
        }
        Returns: Record<string, unknown>
      }
      provision_logical_path: {
        Args: {
          p_path_name: string
          p_physical_path_id: string
          p_protection_fiber_no: number
          p_system_id: string
          p_working_fiber_no: number
        }
        Returns: {
          protection_path_id: string
          working_path_id: string
        }[]
      }
      recalculate_segments_for_cable: {
        Args: { p_cable_id: string }
        Returns: undefined
      }
      search_nodes_for_select: {
        Args: { p_limit?: number; p_search_term?: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      trace_fiber_path: {
        Args: { p_start_fiber_no: number; p_start_segment_id: string }
        Returns: {
          details: string
          distance_km: number
          element_id: string
          element_name: string
          element_type: string
          end_node_id: string
          fiber_in: number
          fiber_out: number
          loss_db: number
          original_cable_id: string
          start_node_id: string
          step_order: number
        }[]
      }
      update_ring_system_associations: {
        Args: { p_ring_id: string; p_system_ids: string[] }
        Returns: undefined
      }
      upsert_ring_associations_from_json: {
        Args: { p_associations: Json; p_ring_id: string }
        Returns: undefined
      }
      upsert_route_topology_from_excel: {
        Args: {
          p_cable_segments: Json
          p_fiber_splices: Json
          p_junction_closures: Json
          p_route_id: string
        }
        Returns: undefined
      }
      upsert_system_connection_with_details: {
        Args: {
          p_a_customer?: string
          p_a_slot?: string
          p_b_customer?: string
          p_b_slot?: string
          p_bandwidth_allocated_mbps?: number
          p_bandwidth_mbps?: number
          p_carrier?: string
          p_commissioned_on?: string
          p_connected_system_type_id?: string
          p_customer_name?: string
          p_en_id?: string
          p_en_interface?: string
          p_en_ip?: unknown
          p_fiber_in?: number
          p_fiber_out?: number
          p_id?: string
          p_media_type_id: string
          p_port?: string
          p_port_capacity?: string
          p_port_type_id?: string
          p_remark?: string
          p_sfp_serial_no?: string
          p_sn_id?: string
          p_sn_interface?: string
          p_sn_ip?: unknown
          p_status: boolean
          p_stm_no?: string
          p_system_id: string
          p_vlan?: string
        }
        Returns: {
          bandwidth_mbps: number | null
          commissioned_on: string | null
          connected_system_type_id: string | null
          created_at: string | null
          en_id: string | null
          en_interface: string | null
          en_ip: unknown
          id: string
          media_type_id: string | null
          remark: string | null
          sn_id: string | null
          sn_interface: string | null
          sn_ip: unknown
          status: boolean | null
          system_id: string
          updated_at: string | null
          vlan: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "system_connections"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      upsert_system_with_details: {
        Args: {
          p_commissioned_on?: string
          p_id?: string
          p_ip_address?: unknown
          p_is_hub: boolean
          p_maan_node_id?: string
          p_maintenance_terminal_id?: string
          p_make?: string
          p_node_id: string
          p_order_in_ring?: number
          p_remark?: string
          p_ring_id?: string
          p_s_no?: string
          p_status: boolean
          p_system_name: string
          p_system_type_id: string
        }
        Returns: {
          commissioned_on: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          is_hub: boolean | null
          maan_node_id: string | null
          maintenance_terminal_id: string | null
          make: string | null
          node_id: string
          remark: string | null
          s_no: string | null
          status: boolean | null
          system_name: string | null
          system_type_id: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "systems"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      validate_ring_path: { Args: { p_path_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      splice_connection: {
        splice_id: string | null
        jc_id: string | null
        jc_name: string | null
        jc_position_km: number | null
        incoming_cable_id: string | null
        incoming_fiber_no: number | null
        outgoing_cable_id: string | null
        outgoing_fiber_no: number | null
        otdr_length_km: number | null
        loss_db: number | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  public: {
    Enums: {},
  },
} as const
