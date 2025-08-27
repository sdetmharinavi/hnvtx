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
    PostgrestVersion: "12.2.3 (519615d)"
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
          ip: unknown | null
          not_after: string | null
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
          ip?: unknown | null
          not_after?: string | null
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
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
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
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
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
      email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
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
      cpan_connections: {
        Row: {
          bandwidth_allocated_mbps: number | null
          customer_name: string | null
          fiber_in: number | null
          fiber_out: number | null
          sfp_capacity: string | null
          sfp_port: string | null
          sfp_serial_no: string | null
          sfp_type_id: string | null
          system_connection_id: string
        }
        Insert: {
          bandwidth_allocated_mbps?: number | null
          customer_name?: string | null
          fiber_in?: number | null
          fiber_out?: number | null
          sfp_capacity?: string | null
          sfp_port?: string | null
          sfp_serial_no?: string | null
          sfp_type_id?: string | null
          system_connection_id: string
        }
        Update: {
          bandwidth_allocated_mbps?: number | null
          customer_name?: string | null
          fiber_in?: number | null
          fiber_out?: number | null
          sfp_capacity?: string | null
          sfp_port?: string | null
          sfp_serial_no?: string | null
          sfp_type_id?: string | null
          system_connection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpan_connections_sfp_type_id_fkey"
            columns: ["sfp_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpan_connections_sfp_type_id_fkey"
            columns: ["sfp_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpan_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "system_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpan_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "v_system_connections_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      cpan_systems: {
        Row: {
          area: string | null
          ring_no: string | null
          system_id: string
        }
        Insert: {
          area?: string | null
          ring_no?: string | null
          system_id: string
        }
        Update: {
          area?: string | null
          ring_no?: string | null
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpan_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpan_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "v_systems_complete"
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
            referencedRelation: "v_employee_designations_with_count"
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
            referencedRelation: "v_employee_designations_with_count"
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
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_joint_connections: {
        Row: {
          created_at: string | null
          id: string
          input_fiber_no: number
          input_ofc_id: string
          joint_id: string
          logical_path_id: string | null
          output_fiber_no: number
          output_ofc_id: string
          splice_loss_db: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_fiber_no: number
          input_ofc_id: string
          joint_id: string
          logical_path_id?: string | null
          output_fiber_no: number
          output_ofc_id: string
          splice_loss_db?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          input_fiber_no?: number
          input_ofc_id?: string
          joint_id?: string
          logical_path_id?: string | null
          output_fiber_no?: number
          output_ofc_id?: string
          splice_loss_db?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_joint_connections_input_ofc_id_fkey"
            columns: ["input_ofc_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_input_ofc_id_fkey"
            columns: ["input_ofc_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_input_ofc_id_fkey"
            columns: ["input_ofc_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_joint_id_fkey"
            columns: ["joint_id"]
            isOneToOne: false
            referencedRelation: "fiber_joints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "logical_fiber_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_logical_path_id_fkey"
            columns: ["logical_path_id"]
            isOneToOne: false
            referencedRelation: "v_end_to_end_paths"
            referencedColumns: ["path_id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_output_ofc_id_fkey"
            columns: ["output_ofc_id"]
            isOneToOne: false
            referencedRelation: "ofc_cables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_output_ofc_id_fkey"
            columns: ["output_ofc_id"]
            isOneToOne: false
            referencedRelation: "v_cable_utilization"
            referencedColumns: ["cable_id"]
          },
          {
            foreignKeyName: "fiber_joint_connections_output_ofc_id_fkey"
            columns: ["output_ofc_id"]
            isOneToOne: false
            referencedRelation: "v_ofc_cables_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      fiber_joints: {
        Row: {
          created_at: string | null
          id: string
          installed_date: string | null
          joint_category: string
          joint_name: string
          joint_type: string
          latitude: number | null
          location_description: string | null
          longitude: number | null
          maintenance_area_id: string | null
          node_id: string | null
          remark: string | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          installed_date?: string | null
          joint_category?: string
          joint_name: string
          joint_type?: string
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          maintenance_area_id?: string | null
          node_id?: string | null
          remark?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          installed_date?: string | null
          joint_category?: string
          joint_name?: string
          joint_type?: string
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          maintenance_area_id?: string | null
          node_id?: string | null
          remark?: string | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiber_joints_maintenance_area_id_fkey"
            columns: ["maintenance_area_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joints_maintenance_area_id_fkey"
            columns: ["maintenance_area_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joints_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiber_joints_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_joint_type"
            columns: ["joint_category", "joint_type"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_joint_type"
            columns: ["joint_category", "joint_type"]
            isOneToOne: false
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_joint_type"
            columns: ["joint_category", "joint_type"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: [
              "maintenance_area_type_category",
              "maintenance_area_type_name",
            ]
          },
          {
            foreignKeyName: "fk_joint_type"
            columns: ["joint_category", "joint_type"]
            isOneToOne: false
            referencedRelation: "v_rings_with_count"
            referencedColumns: ["ring_type_category", "ring_type_name"]
          },
          {
            foreignKeyName: "fk_joint_type"
            columns: ["joint_category", "joint_type"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["system_category", "system_type_name"]
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
          operational_status: string
          operational_status_category: string
          path_category: string
          path_name: string | null
          path_type: string
          remark: string | null
          service_type: string | null
          source_port: string | null
          source_system_id: string | null
          total_distance_km: number | null
          total_loss_db: number | null
          updated_at: string | null
          wavelength_nm: number | null
        }
        Insert: {
          bandwidth_gbps?: number | null
          commissioned_date?: string | null
          created_at?: string | null
          destination_port?: string | null
          destination_system_id?: string | null
          id?: string
          operational_status?: string
          operational_status_category?: string
          path_category?: string
          path_name?: string | null
          path_type?: string
          remark?: string | null
          service_type?: string | null
          source_port?: string | null
          source_system_id?: string | null
          total_distance_km?: number | null
          total_loss_db?: number | null
          updated_at?: string | null
          wavelength_nm?: number | null
        }
        Update: {
          bandwidth_gbps?: number | null
          commissioned_date?: string | null
          created_at?: string | null
          destination_port?: string | null
          destination_system_id?: string | null
          id?: string
          operational_status?: string
          operational_status_category?: string
          path_category?: string
          path_name?: string | null
          path_type?: string
          remark?: string | null
          service_type?: string | null
          source_port?: string | null
          source_system_id?: string | null
          total_distance_km?: number | null
          total_loss_db?: number | null
          updated_at?: string | null
          wavelength_nm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_operational_status"
            columns: ["operational_status_category", "operational_status"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_operational_status"
            columns: ["operational_status_category", "operational_status"]
            isOneToOne: false
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_operational_status"
            columns: ["operational_status_category", "operational_status"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: [
              "maintenance_area_type_category",
              "maintenance_area_type_name",
            ]
          },
          {
            foreignKeyName: "fk_operational_status"
            columns: ["operational_status_category", "operational_status"]
            isOneToOne: false
            referencedRelation: "v_rings_with_count"
            referencedColumns: ["ring_type_category", "ring_type_name"]
          },
          {
            foreignKeyName: "fk_operational_status"
            columns: ["operational_status_category", "operational_status"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["system_category", "system_type_name"]
          },
          {
            foreignKeyName: "fk_path_type"
            columns: ["path_category", "path_type"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_path_type"
            columns: ["path_category", "path_type"]
            isOneToOne: false
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_path_type"
            columns: ["path_category", "path_type"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: [
              "maintenance_area_type_category",
              "maintenance_area_type_name",
            ]
          },
          {
            foreignKeyName: "fk_path_type"
            columns: ["path_category", "path_type"]
            isOneToOne: false
            referencedRelation: "v_rings_with_count"
            referencedColumns: ["ring_type_category", "ring_type_name"]
          },
          {
            foreignKeyName: "fk_path_type"
            columns: ["path_category", "path_type"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["system_category", "system_type_name"]
          },
          {
            foreignKeyName: "logical_fiber_paths_destination_system_id_fkey"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_destination_system_id_fkey"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
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
          is_system_default?: boolean | null
          name?: string
          sort_order?: number | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      maan_connections: {
        Row: {
          bandwidth_allocated_mbps: number | null
          customer_name: string | null
          fiber_in: number | null
          fiber_out: number | null
          sfp_capacity: string | null
          sfp_port: string | null
          sfp_serial_no: string | null
          sfp_type_id: string | null
          system_connection_id: string
        }
        Insert: {
          bandwidth_allocated_mbps?: number | null
          customer_name?: string | null
          fiber_in?: number | null
          fiber_out?: number | null
          sfp_capacity?: string | null
          sfp_port?: string | null
          sfp_serial_no?: string | null
          sfp_type_id?: string | null
          system_connection_id: string
        }
        Update: {
          bandwidth_allocated_mbps?: number | null
          customer_name?: string | null
          fiber_in?: number | null
          fiber_out?: number | null
          sfp_capacity?: string | null
          sfp_port?: string | null
          sfp_serial_no?: string | null
          sfp_type_id?: string | null
          system_connection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maan_connections_sfp_type_id_fkey"
            columns: ["sfp_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maan_connections_sfp_type_id_fkey"
            columns: ["sfp_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maan_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "system_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maan_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "v_system_connections_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      maan_systems: {
        Row: {
          area: string | null
          ring_no: string | null
          system_id: string
        }
        Insert: {
          area?: string | null
          ring_no?: string | null
          system_id: string
        }
        Update: {
          area?: string | null
          ring_no?: string | null
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maan_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maan_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "v_lookup_types_with_count"
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
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: ["id"]
          },
        ]
      }
      management_ports: {
        Row: {
          commissioned_on: string | null
          created_at: string | null
          id: string
          name: string | null
          node_id: string | null
          port_no: string
          remark: string | null
          status: boolean | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          commissioned_on?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          node_id?: string | null
          port_no: string
          remark?: string | null
          status?: boolean | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          commissioned_on?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          node_id?: string | null
          port_no?: string
          remark?: string | null
          status?: boolean | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_ports_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_ports_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_ports_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_ports_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          builtup: string | null
          created_at: string | null
          east_port: string | null
          id: string
          ip_address: unknown | null
          latitude: number | null
          longitude: number | null
          maintenance_terminal_id: string | null
          name: string
          node_type_id: string | null
          order_in_ring: number | null
          remark: string | null
          ring_id: string | null
          ring_status: string | null
          site_id: string | null
          status: boolean | null
          updated_at: string | null
          vlan: string | null
          west_port: string | null
        }
        Insert: {
          builtup?: string | null
          created_at?: string | null
          east_port?: string | null
          id?: string
          ip_address?: unknown | null
          latitude?: number | null
          longitude?: number | null
          maintenance_terminal_id?: string | null
          name: string
          node_type_id?: string | null
          order_in_ring?: number | null
          remark?: string | null
          ring_id?: string | null
          ring_status?: string | null
          site_id?: string | null
          status?: boolean | null
          updated_at?: string | null
          vlan?: string | null
          west_port?: string | null
        }
        Update: {
          builtup?: string | null
          created_at?: string | null
          east_port?: string | null
          id?: string
          ip_address?: unknown | null
          latitude?: number | null
          longitude?: number | null
          maintenance_terminal_id?: string | null
          name?: string
          node_type_id?: string | null
          order_in_ring?: number | null
          remark?: string | null
          ring_id?: string | null
          ring_status?: string | null
          site_id?: string | null
          status?: boolean | null
          updated_at?: string | null
          vlan?: string | null
          west_port?: string | null
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "rings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "v_rings_with_count"
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
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
          fiber_no_en: number | null
          fiber_no_sn: number
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
        }
        Insert: {
          connection_category?: string
          connection_type?: string
          created_at?: string | null
          destination_port?: string | null
          en_dom?: string | null
          en_power_dbm?: number | null
          fiber_no_en?: number | null
          fiber_no_sn: number
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
        }
        Update: {
          connection_category?: string
          connection_type?: string
          created_at?: string | null
          destination_port?: string | null
          en_dom?: string | null
          en_power_dbm?: number | null
          fiber_no_en?: number | null
          fiber_no_sn?: number
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
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: [
              "maintenance_area_type_category",
              "maintenance_area_type_name",
            ]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_rings_with_count"
            referencedColumns: ["ring_type_category", "ring_type_name"]
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
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
      sdh_node_associations: {
        Row: {
          id: string
          node_id: string
          node_ip: unknown | null
          node_position: string | null
          sdh_system_id: string
        }
        Insert: {
          id?: string
          node_id: string
          node_ip?: unknown | null
          node_position?: string | null
          sdh_system_id: string
        }
        Update: {
          id?: string
          node_id?: string
          node_ip?: unknown | null
          node_position?: string | null
          sdh_system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdh_node_associations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdh_node_associations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "v_nodes_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdh_node_associations_sdh_system_id_fkey"
            columns: ["sdh_system_id"]
            isOneToOne: false
            referencedRelation: "sdh_systems"
            referencedColumns: ["system_id"]
          },
        ]
      }
      sdh_systems: {
        Row: {
          gne: string | null
          make: string | null
          system_id: string
        }
        Insert: {
          gne?: string | null
          make?: string | null
          system_id: string
        }
        Update: {
          gne?: string | null
          make?: string | null
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdh_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdh_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      system_connections: {
        Row: {
          bandwidth_mbps: number | null
          commissioned_on: string | null
          connected_system_id: string | null
          created_at: string | null
          en_id: string | null
          en_interface: string | null
          en_ip: unknown | null
          id: string
          media_type_id: string | null
          remark: string | null
          sn_id: string | null
          sn_interface: string | null
          sn_ip: unknown | null
          status: boolean | null
          system_id: string
          updated_at: string | null
          vlan: string | null
        }
        Insert: {
          bandwidth_mbps?: number | null
          commissioned_on?: string | null
          connected_system_id?: string | null
          created_at?: string | null
          en_id?: string | null
          en_interface?: string | null
          en_ip?: unknown | null
          id?: string
          media_type_id?: string | null
          remark?: string | null
          sn_id?: string | null
          sn_interface?: string | null
          sn_ip?: unknown | null
          status?: boolean | null
          system_id: string
          updated_at?: string | null
          vlan?: string | null
        }
        Update: {
          bandwidth_mbps?: number | null
          commissioned_on?: string | null
          connected_system_id?: string | null
          created_at?: string | null
          en_id?: string | null
          en_interface?: string | null
          en_ip?: unknown | null
          id?: string
          media_type_id?: string | null
          remark?: string | null
          sn_id?: string | null
          sn_interface?: string | null
          sn_ip?: unknown | null
          status?: boolean | null
          system_id?: string
          updated_at?: string | null
          vlan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_connections_connected_system_id_fkey"
            columns: ["connected_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_connections_connected_system_id_fkey"
            columns: ["connected_system_id"]
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
            referencedRelation: "v_lookup_types_with_count"
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
          ip_address: unknown | null
          maintenance_terminal_id: string | null
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
          ip_address?: unknown | null
          maintenance_terminal_id?: string | null
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
          ip_address?: unknown | null
          maintenance_terminal_id?: string | null
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: string | null
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: string | null
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: string | null
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_profiles_extended"
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
      vmux_connections: {
        Row: {
          c_code: string | null
          channel: string | null
          subscriber: string | null
          system_connection_id: string
          tk: string | null
        }
        Insert: {
          c_code?: string | null
          channel?: string | null
          subscriber?: string | null
          system_connection_id: string
          tk?: string | null
        }
        Update: {
          c_code?: string | null
          channel?: string | null
          subscriber?: string | null
          system_connection_id?: string
          tk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vmux_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "system_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vmux_connections_system_connection_id_fkey"
            columns: ["system_connection_id"]
            isOneToOne: true
            referencedRelation: "v_system_connections_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      vmux_systems: {
        Row: {
          system_id: string
          vm_id: string | null
        }
        Insert: {
          system_id: string
          vm_id?: string | null
        }
        Update: {
          system_id?: string
          vm_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vmux_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vmux_systems_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: true
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
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
      v_employee_designations_with_count: {
        Row: {
          active_count: number | null
          created_at: string | null
          id: string | null
          inactive_count: number | null
          name: string | null
          parent_id: string | null
          status: boolean | null
          total_count: number | null
          updated_at: string | null
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
            referencedRelation: "v_employee_designations_with_count"
            referencedColumns: ["id"]
          },
        ]
      }
      v_employees_with_count: {
        Row: {
          active_count: number | null
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
          inactive_count: number | null
          maintenance_terminal_id: string | null
          remark: string | null
          status: boolean | null
          total_count: number | null
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
            referencedRelation: "v_employee_designations_with_count"
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            foreignKeyName: "logical_fiber_paths_destination_system_id_fkey"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_destination_system_id_fkey"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logical_fiber_paths_source_system_id_fkey"
            columns: ["source_system_id"]
            isOneToOne: false
            referencedRelation: "v_systems_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      v_lookup_types_with_count: {
        Row: {
          active_count: number | null
          category: string | null
          code: string | null
          created_at: string | null
          description: string | null
          id: string | null
          inactive_count: number | null
          is_system_default: boolean | null
          name: string | null
          sort_order: number | null
          status: boolean | null
          total_count: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_maintenance_areas_with_count: {
        Row: {
          active_count: number | null
          address: string | null
          area_type_id: string | null
          code: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string | null
          inactive_count: number | null
          latitude: number | null
          longitude: number | null
          maintenance_area_type_category: string | null
          maintenance_area_type_code: string | null
          maintenance_area_type_created_at: string | null
          maintenance_area_type_is_system_default: boolean | null
          maintenance_area_type_name: string | null
          maintenance_area_type_sort_order: number | null
          maintenance_area_type_status: boolean | null
          maintenance_area_type_updated_at: string | null
          name: string | null
          parent_id: string | null
          status: boolean | null
          total_count: number | null
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
            referencedRelation: "v_lookup_types_with_count"
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
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: ["id"]
          },
        ]
      }
      v_nodes_complete: {
        Row: {
          active_count: number | null
          builtup: string | null
          created_at: string | null
          east_port: string | null
          id: string | null
          inactive_count: number | null
          ip_address: unknown | null
          latitude: number | null
          longitude: number | null
          maintenance_area_code: string | null
          maintenance_area_name: string | null
          maintenance_area_type_name: string | null
          maintenance_terminal_id: string | null
          name: string | null
          node_type_code: string | null
          node_type_id: string | null
          node_type_name: string | null
          order_in_ring: number | null
          remark: string | null
          ring_id: string | null
          ring_name: string | null
          ring_status: string | null
          ring_type_code: string | null
          ring_type_id: string | null
          ring_type_name: string | null
          site_id: string | null
          status: boolean | null
          total_count: number | null
          updated_at: string | null
          vlan: string | null
          west_port: string | null
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "rings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_ring_id_fkey"
            columns: ["ring_id"]
            isOneToOne: false
            referencedRelation: "v_rings_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ofc_cables_complete: {
        Row: {
          active_count: number | null
          asset_no: string | null
          capacity: number | null
          commissioned_on: string | null
          created_at: string | null
          current_rkm: number | null
          en_id: string | null
          id: string | null
          inactive_count: number | null
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
          status: boolean | null
          total_count: number | null
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["category", "name"]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: [
              "maintenance_area_type_category",
              "maintenance_area_type_name",
            ]
          },
          {
            foreignKeyName: "fk_connection_type"
            columns: ["connection_category", "connection_type"]
            isOneToOne: false
            referencedRelation: "v_rings_with_count"
            referencedColumns: ["ring_type_category", "ring_type_name"]
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
        ]
      }
      v_rings_with_count: {
        Row: {
          active_count: number | null
          created_at: string | null
          description: string | null
          id: string | null
          inactive_count: number | null
          maintenance_area_area_type_id: string | null
          maintenance_area_code: string | null
          maintenance_area_contact_number: string | null
          maintenance_area_contact_person: string | null
          maintenance_area_created_at: string | null
          maintenance_area_email: string | null
          maintenance_area_latitude: number | null
          maintenance_area_longitude: number | null
          maintenance_area_name: string | null
          maintenance_area_parent_id: string | null
          maintenance_area_status: boolean | null
          maintenance_area_updated_at: string | null
          maintenance_terminal_id: string | null
          name: string | null
          ring_type_category: string | null
          ring_type_code: string | null
          ring_type_created_at: string | null
          ring_type_id: string | null
          ring_type_is_system_default: boolean | null
          ring_type_name: string | null
          ring_type_sort_order: number | null
          ring_type_status: boolean | null
          ring_type_updated_at: string | null
          status: boolean | null
          total_count: number | null
          total_nodes: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_areas_area_type_id_fkey"
            columns: ["maintenance_area_area_type_id"]
            isOneToOne: false
            referencedRelation: "lookup_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_area_type_id_fkey"
            columns: ["maintenance_area_area_type_id"]
            isOneToOne: false
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_parent_id_fkey"
            columns: ["maintenance_area_parent_id"]
            isOneToOne: false
            referencedRelation: "maintenance_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_areas_parent_id_fkey"
            columns: ["maintenance_area_parent_id"]
            isOneToOne: false
            referencedRelation: "v_maintenance_areas_with_count"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "v_maintenance_areas_with_count"
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
            referencedRelation: "v_lookup_types_with_count"
            referencedColumns: ["id"]
          },
        ]
      }
      v_system_connections_complete: {
        Row: {
          bandwidth_mbps: number | null
          commissioned_on: string | null
          connected_system_name: string | null
          connected_system_type_name: string | null
          created_at: string | null
          en_interface: string | null
          en_ip: unknown | null
          en_name: string | null
          en_node_name: string | null
          id: string | null
          maan_bandwidth_allocated_mbps: number | null
          maan_customer_name: string | null
          maan_fiber_in: number | null
          maan_fiber_out: number | null
          maan_sfp_capacity: string | null
          maan_sfp_port: string | null
          maan_sfp_serial_no: string | null
          maan_sfp_type_name: string | null
          media_type_name: string | null
          remark: string | null
          sdh_a_customer: string | null
          sdh_a_slot: string | null
          sdh_b_customer: string | null
          sdh_b_slot: string | null
          sdh_carrier: string | null
          sdh_stm_no: string | null
          sn_interface: string | null
          sn_ip: unknown | null
          sn_name: string | null
          sn_node_name: string | null
          status: boolean | null
          system_id: string | null
          system_name: string | null
          system_type_name: string | null
          updated_at: string | null
          vlan: string | null
          vmux_c_code: string | null
          vmux_channel: string | null
          vmux_subscriber: string | null
          vmux_tk: string | null
        }
        Relationships: [
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
      v_systems_complete: {
        Row: {
          commissioned_on: string | null
          created_at: string | null
          id: string | null
          ip_address: unknown | null
          latitude: number | null
          longitude: number | null
          maan_area: string | null
          maan_ring_no: string | null
          maintenance_area_name: string | null
          node_ip: unknown | null
          node_name: string | null
          remark: string | null
          s_no: string | null
          sdh_gne: string | null
          sdh_make: string | null
          status: boolean | null
          system_category: string | null
          system_name: string | null
          system_type_code: string | null
          system_type_name: string | null
          updated_at: string | null
          vmux_vm_id: string | null
        }
        Relationships: []
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
      admin_get_all_users: {
        Args: {
          date_from?: string
          date_to?: string
          filter_role?: string
          filter_status?: string
          page_limit?: number
          page_offset?: number
          search_query?: string
        }
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
          total_count: number
          updated_at: string
        }[]
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
        Returns: {
          account_age_days: number
          active_count: number
          address: Json
          avatar_url: string
          computed_status: string
          created_at: string
          date_of_birth: string
          designation: string
          email: string
          first_name: string
          full_name: string
          id: string
          inactive_count: number
          is_email_verified: boolean
          is_super_admin: boolean
          last_activity_period: string
          last_name: string
          last_sign_in_at: string
          phone_number: string
          preferences: Json
          role: string
          status: string
          total_count: number
          updated_at: string
        }[]
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
      bulk_update: {
        Args: { batch_size?: number; table_name: string; updates: Json }
        Returns: Json
      }
      execute_sql: {
        Args: { sql_query: string }
        Returns: Json
      }
      get_dashboard_overview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
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
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_user_details: {
        Args: Record<PropertyKey, never>
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
      get_paged_employee_designations_with_count: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          created_at: string
          id: string
          inactive_count: number
          name: string
          parent_id: string
          status: boolean
          total_count: number
          updated_at: string
        }[]
      }
      get_paged_employees_with_count: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          created_at: string
          employee_addr: string
          employee_contact: string
          employee_designation_id: string
          employee_designation_name: string
          employee_dob: string
          employee_doj: string
          employee_email: string
          employee_name: string
          employee_pers_no: string
          id: string
          inactive_count: number
          maintenance_terminal_id: string
          remark: string
          status: boolean
          total_count: number
          updated_at: string
        }[]
      }
      get_paged_lookup_types_with_count: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          category: string
          code: string
          created_at: string
          description: string
          id: string
          inactive_count: number
          is_system_default: boolean
          name: string
          sort_order: number
          status: boolean
          total_count: number
          updated_at: string
        }[]
      }
      get_paged_maintenance_areas_with_count: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          address: string
          area_type_id: string
          code: string
          contact_number: string
          contact_person: string
          created_at: string
          email: string
          id: string
          inactive_count: number
          latitude: number
          longitude: number
          maintenance_area_type_category: string
          maintenance_area_type_code: string
          maintenance_area_type_created_at: string
          maintenance_area_type_is_system_default: boolean
          maintenance_area_type_name: string
          maintenance_area_type_sort_order: number
          maintenance_area_type_status: boolean
          maintenance_area_type_updated_at: string
          name: string
          parent_id: string
          status: boolean
          total_count: number
          updated_at: string
        }[]
      }
      get_paged_nodes_complete: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          builtup: string
          created_at: string
          east_port: string
          id: string
          inactive_count: number
          ip_address: unknown
          latitude: number
          longitude: number
          maintenance_area_code: string
          maintenance_area_name: string
          maintenance_area_type_name: string
          maintenance_terminal_id: string
          name: string
          node_type_code: string
          node_type_id: string
          node_type_name: string
          order_in_ring: number
          remark: string
          ring_id: string
          ring_name: string
          ring_status: string
          ring_type_code: string
          ring_type_id: string
          ring_type_name: string
          site_id: string
          status: boolean
          total_count: number
          updated_at: string
          vlan: string
          west_port: string
        }[]
      }
      get_paged_ofc_cables_complete: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          asset_no: string
          capacity: number
          commissioned_on: string
          created_at: string
          current_rkm: number
          en_id: string
          id: string
          inactive_count: number
          maintenance_area_code: string
          maintenance_area_name: string
          maintenance_terminal_id: string
          ofc_owner_code: string
          ofc_owner_id: string
          ofc_owner_name: string
          ofc_type_code: string
          ofc_type_id: string
          ofc_type_name: string
          remark: string
          route_name: string
          sn_id: string
          status: boolean
          total_count: number
          transnet_id: string
          transnet_rkm: number
          updated_at: string
        }[]
      }
      get_paged_ofc_connections_complete: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          created_at: string
          en_dom: string
          en_id: string
          en_name: string
          fiber_no_en: number
          fiber_no_sn: number
          id: string
          inactive_count: number
          maintenance_area_name: string
          ofc_id: string
          ofc_route_name: string
          ofc_type_name: string
          otdr_distance_en_km: number
          otdr_distance_sn_km: number
          remark: string
          sn_dom: string
          sn_id: string
          sn_name: string
          status: boolean
          system_name: string
          total_count: number
          updated_at: string
        }[]
      }
      get_paged_rings_with_count: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          created_at: string
          description: string
          id: string
          inactive_count: number
          maintenance_area_area_type_id: string
          maintenance_area_code: string
          maintenance_area_contact_number: string
          maintenance_area_contact_person: string
          maintenance_area_created_at: string
          maintenance_area_email: string
          maintenance_area_latitude: number
          maintenance_area_longitude: number
          maintenance_area_name: string
          maintenance_area_parent_id: string
          maintenance_area_status: boolean
          maintenance_area_updated_at: string
          maintenance_terminal_id: string
          name: string
          ring_type_category: string
          ring_type_code: string
          ring_type_created_at: string
          ring_type_id: string
          ring_type_is_system_default: boolean
          ring_type_name: string
          ring_type_sort_order: number
          ring_type_status: boolean
          ring_type_updated_at: string
          status: boolean
          total_count: number
          total_nodes: number
          updated_at: string
        }[]
      }
      get_paged_system_connections_complete: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          active_count: number
          bandwidth_mbps: number
          commissioned_on: string
          connected_system_name: string
          connected_system_type_name: string
          created_at: string
          en_interface: string
          en_ip: string
          en_name: string
          id: string
          inactive_count: number
          maan_bandwidth_allocated_mbps: number
          maan_customer_name: string
          maan_fiber_in: number
          maan_fiber_out: number
          maan_sfp_capacity: string
          maan_sfp_port: string
          maan_sfp_serial_no: string
          maan_sfp_type_name: string
          media_type_name: string
          remark: string
          sdh_a_customer: string
          sdh_a_slot: string
          sdh_b_customer: string
          sdh_b_slot: string
          sdh_carrier: string
          sdh_stm_no: string
          sn_interface: string
          sn_ip: string
          sn_name: string
          status: boolean
          system_id: string
          system_name: string
          system_type_name: string
          total_count: number
          updated_at: string
          vlan: string
          vmux_c_code: string
          vmux_channel: string
          vmux_subscriber: string
          vmux_tk: string
        }[]
      }
      get_paged_v_systems_complete: {
        Args: {
          p_filters?: Json
          p_limit: number
          p_offset: number
          p_order_by?: string
          p_order_dir?: string
        }
        Returns: {
          commissioned_on: string
          created_at: string
          id: string
          ip_address: unknown
          latitude: number
          longitude: number
          maan_area: string
          maan_ring_no: string
          maintenance_area_name: string
          node_ip: unknown
          node_name: string
          remark: string
          s_no: string
          sdh_gne: string
          sdh_make: string
          status: boolean
          system_category: string
          system_name: string
          system_type_code: string
          system_type_name: string
          total_count: number
          updated_at: string
          vmux_vm_id: string
        }[]
      }
      get_unique_values: {
        Args: {
          column_name: string
          filters?: Json
          limit_count?: number
          order_by?: Json
          table_name: string
        }
        Returns: {
          value: Json
        }[]
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_action_type: string
          p_details?: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
