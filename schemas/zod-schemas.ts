// Auto-generated Zod schemas from flattened-types.ts

import { z } from "zod";

import { UserRole } from "@/types/user-roles";

// ============= TABLE SCHEMAS =============

export const authAudit_log_entriesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  instance_id: z.uuid().nullable(),
  ip_address: z.string().min(5, "Address must be at least 5 characters").max(500),
  payload: z.any().nullable(),
});

export const authAudit_log_entriesInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid(),
  instance_id: z.uuid().nullable().optional(),
  ip_address: z.string().min(5, "Address must be at least 5 characters").max(500).optional(),
  payload: z.any().nullable().optional(),
});

export const authAudit_log_entriesUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  instance_id: z.uuid().nullable().optional(),
  ip_address: z.string().min(5, "Address must be at least 5 characters").max(500).optional(),
  payload: z.any().nullable().optional(),
});

export const authFlow_stateRowSchema = z.object({
  auth_code: z.string(),
  auth_code_issued_at: z.iso.datetime().nullable(),
  authentication_method: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  provider_access_token: z.jwt().nullable(),
  provider_refresh_token: z.jwt().nullable(),
  provider_type: z.string(),
  updated_at: z.iso.datetime().nullable(),
  user_id: z.uuid().nullable(),
});

export const authFlow_stateInsertSchema = z.object({
  auth_code: z.string(),
  auth_code_issued_at: z.iso.datetime().nullable().optional(),
  authentication_method: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid(),
  provider_access_token: z.jwt().nullable().optional(),
  provider_refresh_token: z.jwt().nullable().optional(),
  provider_type: z.string(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid().nullable().optional(),
});

export const authFlow_stateUpdateSchema = z.object({
  auth_code: z.string().optional(),
  auth_code_issued_at: z.iso.datetime().nullable().optional(),
  authentication_method: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  provider_access_token: z.jwt().nullable().optional(),
  provider_refresh_token: z.jwt().nullable().optional(),
  provider_type: z.string().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid().nullable().optional(),
});

export const authIdentitiesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  email: z.email().nullable(),
  id: z.uuid(),
  identity_data: z.any(),
  last_sign_in_at: z.iso.datetime().nullable(),
  provider: z.string(),
  provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable(),
  user_id: z.uuid(),
});

export const authIdentitiesInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  email: z.email().nullable().optional(),
  id: z.uuid().optional(),
  identity_data: z.any(),
  last_sign_in_at: z.iso.datetime().nullable().optional(),
  provider: z.string(),
  provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid(),
});

export const authIdentitiesUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  email: z.email().nullable().optional(),
  id: z.uuid().optional(),
  identity_data: z.any().optional(),
  last_sign_in_at: z.iso.datetime().nullable().optional(),
  provider: z.string().optional(),
  provider_id: z.uuid().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid().optional(),
});

export const authInstancesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  raw_base_config: z.string().nullable(),
  updated_at: z.iso.datetime().nullable(),
  uuid: z.uuid().nullable(),
});

export const authInstancesInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid(),
  raw_base_config: z.string().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  uuid: z.uuid().nullable().optional(),
});

export const authInstancesUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  raw_base_config: z.string().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  uuid: z.uuid().nullable().optional(),
});

export const authMfa_amr_claimsRowSchema = z.object({
  authentication_method: z.string(),
  created_at: z.iso.datetime(),
  id: z.uuid(),
  session_id: z.uuid(),
  updated_at: z.iso.datetime(),
});

export const authMfa_amr_claimsInsertSchema = z.object({
  authentication_method: z.string(),
  created_at: z.iso.datetime(),
  id: z.uuid(),
  session_id: z.uuid(),
  updated_at: z.iso.datetime(),
});

export const authMfa_amr_claimsUpdateSchema = z.object({
  authentication_method: z.string().optional(),
  created_at: z.iso.datetime().optional(),
  id: z.uuid().optional(),
  session_id: z.uuid().optional(),
  updated_at: z.iso.datetime().optional(),
});

export const authMfa_challengesRowSchema = z.object({
  created_at: z.iso.datetime(),
  factor_id: z.uuid(),
  id: z.uuid(),
  ip_address: z.string(),
  otp_code: z.string().nullable(),
  verified_at: z.iso.datetime().nullable(),
  web_authn_session_data: z.any().nullable(),
});

export const authMfa_challengesInsertSchema = z.object({
  created_at: z.iso.datetime(),
  factor_id: z.uuid(),
  id: z.uuid(),
  ip_address: z.string(),
  otp_code: z.string().nullable().optional(),
  verified_at: z.iso.datetime().nullable().optional(),
  web_authn_session_data: z.any().nullable().optional(),
});

export const authMfa_challengesUpdateSchema = z.object({
  created_at: z.iso.datetime().optional(),
  factor_id: z.uuid().optional(),
  id: z.uuid().optional(),
  ip_address: z.string().optional(),
  otp_code: z.string().nullable().optional(),
  verified_at: z.iso.datetime().nullable().optional(),
  web_authn_session_data: z.any().nullable().optional(),
});

export const authMfa_factorsRowSchema = z.object({
  created_at: z.iso.datetime(),
  factor_type: z.string(),
  friendly_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  id: z.uuid(),
  last_challenged_at: z.iso.datetime().nullable(),
  phone: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  secret: z.string().nullable(),
  status: z.string(),
  updated_at: z.iso.datetime(),
  user_id: z.uuid(),
  web_authn_aaguid: z.string().nullable(),
  web_authn_credential: z.any().nullable(),
});

export const authMfa_factorsInsertSchema = z.object({
  created_at: z.iso.datetime(),
  factor_type: z.string(),
  friendly_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  id: z.uuid(),
  last_challenged_at: z.iso.datetime().nullable().optional(),
  phone: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  secret: z.string().nullable().optional(),
  status: z.string(),
  updated_at: z.iso.datetime(),
  user_id: z.uuid(),
  web_authn_aaguid: z.string().nullable().optional(),
  web_authn_credential: z.any().nullable().optional(),
});

export const authMfa_factorsUpdateSchema = z.object({
  created_at: z.iso.datetime().optional(),
  factor_type: z.string().optional(),
  friendly_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  id: z.uuid().optional(),
  last_challenged_at: z.iso.datetime().nullable().optional(),
  phone: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  secret: z.string().nullable().optional(),
  status: z.string().optional(),
  updated_at: z.iso.datetime().optional(),
  user_id: z.uuid().optional(),
  web_authn_aaguid: z.string().nullable().optional(),
  web_authn_credential: z.any().nullable().optional(),
});

export const authOauth_clientsRowSchema = z.object({
  client_id: z.uuid(),
  client_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  client_secret_hash: z.string(),
  client_uri: z.string().nullable(),
  created_at: z.iso.datetime(),
  deleted_at: z.iso.datetime().nullable(),
  grant_types: z.string(),
  id: z.uuid(),
  logo_uri: z.string().nullable(),
  redirect_uris: z.string(),
  registration_type: z.string(),
  updated_at: z.iso.datetime(),
});

export const authOauth_clientsInsertSchema = z.object({
  client_id: z.uuid(),
  client_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  client_secret_hash: z.string(),
  client_uri: z.string().nullable().optional(),
  created_at: z.iso.datetime().optional(),
  deleted_at: z.iso.datetime().nullable().optional(),
  grant_types: z.string(),
  id: z.uuid(),
  logo_uri: z.string().nullable().optional(),
  redirect_uris: z.string(),
  registration_type: z.string(),
  updated_at: z.iso.datetime().optional(),
});

export const authOauth_clientsUpdateSchema = z.object({
  client_id: z.uuid().optional(),
  client_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  client_secret_hash: z.string().optional(),
  client_uri: z.string().nullable().optional(),
  created_at: z.iso.datetime().optional(),
  deleted_at: z.iso.datetime().nullable().optional(),
  grant_types: z.string().optional(),
  id: z.uuid().optional(),
  logo_uri: z.string().nullable().optional(),
  redirect_uris: z.string().optional(),
  registration_type: z.string().optional(),
  updated_at: z.iso.datetime().optional(),
});

export const authOne_time_tokensRowSchema = z.object({
  created_at: z.iso.datetime(),
  id: z.uuid(),
  relates_to: z.string(),
  token_hash: z.jwt(),
  token_type: z.string(),
  updated_at: z.iso.datetime(),
  user_id: z.uuid(),
});

export const authOne_time_tokensInsertSchema = z.object({
  created_at: z.iso.datetime().optional(),
  id: z.uuid(),
  relates_to: z.string(),
  token_hash: z.jwt(),
  token_type: z.string(),
  updated_at: z.iso.datetime().optional(),
  user_id: z.uuid(),
});

export const authOne_time_tokensUpdateSchema = z.object({
  created_at: z.iso.datetime().optional(),
  id: z.uuid().optional(),
  relates_to: z.string().optional(),
  token_hash: z.jwt().optional(),
  token_type: z.string().optional(),
  updated_at: z.iso.datetime().optional(),
  user_id: z.uuid().optional(),
});

export const authRefresh_tokensRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.number().int().positive(),
  instance_id: z.uuid().nullable(),
  parent: z.string().nullable(),
  revoked: z.boolean().nullable(),
  session_id: z.uuid().nullable(),
  token: z.jwt().nullable(),
  updated_at: z.iso.datetime().nullable(),
  user_id: z.uuid().nullable(),
});

export const authRefresh_tokensInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.number().int().positive().optional(),
  instance_id: z.uuid().nullable().optional(),
  parent: z.string().nullable().optional(),
  revoked: z.boolean().nullable().optional(),
  session_id: z.uuid().nullable().optional(),
  token: z.jwt().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid().nullable().optional(),
});

export const authRefresh_tokensUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.number().int().positive().optional(),
  instance_id: z.uuid().nullable().optional(),
  parent: z.string().nullable().optional(),
  revoked: z.boolean().nullable().optional(),
  session_id: z.uuid().nullable().optional(),
  token: z.jwt().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid().nullable().optional(),
});

export const authSaml_providersRowSchema = z.object({
  attribute_mapping: z.any().nullable(),
  created_at: z.iso.datetime().nullable(),
  entity_id: z.uuid(),
  id: z.uuid(),
  metadata_url: z.url().nullable(),
  metadata_xml: z.string(),
  name_id_format: z.string().nullable(),
  sso_provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable(),
});

export const authSaml_providersInsertSchema = z.object({
  attribute_mapping: z.any().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  entity_id: z.uuid(),
  id: z.uuid(),
  metadata_url: z.url().nullable().optional(),
  metadata_xml: z.string(),
  name_id_format: z.string().nullable().optional(),
  sso_provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authSaml_providersUpdateSchema = z.object({
  attribute_mapping: z.any().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  entity_id: z.uuid().optional(),
  id: z.uuid().optional(),
  metadata_url: z.url().nullable().optional(),
  metadata_xml: z.string().optional(),
  name_id_format: z.string().nullable().optional(),
  sso_provider_id: z.uuid().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authSaml_relay_statesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  flow_state_id: z.uuid().nullable(),
  for_email: z.email().nullable(),
  id: z.uuid(),
  redirect_to: z.string().nullable(),
  request_id: z.uuid(),
  sso_provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable(),
});

export const authSaml_relay_statesInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  flow_state_id: z.uuid().nullable().optional(),
  for_email: z.email().nullable().optional(),
  id: z.uuid(),
  redirect_to: z.string().nullable().optional(),
  request_id: z.uuid(),
  sso_provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authSaml_relay_statesUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  flow_state_id: z.uuid().nullable().optional(),
  for_email: z.email().nullable().optional(),
  id: z.uuid().optional(),
  redirect_to: z.string().nullable().optional(),
  request_id: z.uuid().optional(),
  sso_provider_id: z.uuid().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authSchema_migrationsRowSchema = z.object({
  version: z.string(),
});

export const authSchema_migrationsInsertSchema = z.object({
  version: z.string(),
});

export const authSchema_migrationsUpdateSchema = z.object({
  version: z.string().optional(),
});

export const authSessionsRowSchema = z.object({
  aal: z.string().nullable(),
  created_at: z.iso.datetime().nullable(),
  factor_id: z.uuid().nullable(),
  id: z.uuid(),
  ip: z.string().nullable(),
  not_after: z.string().nullable(),
  refreshed_at: z.iso.datetime().nullable(),
  tag: z.string().nullable(),
  updated_at: z.iso.datetime().nullable(),
  user_agent: z.string().nullable(),
  user_id: z.uuid(),
});

export const authSessionsInsertSchema = z.object({
  aal: z.string().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  factor_id: z.uuid().nullable().optional(),
  id: z.uuid(),
  ip: z.string().nullable().optional(),
  not_after: z.string().nullable().optional(),
  refreshed_at: z.iso.datetime().nullable().optional(),
  tag: z.string().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  user_id: z.uuid(),
});

export const authSessionsUpdateSchema = z.object({
  aal: z.string().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  factor_id: z.uuid().nullable().optional(),
  id: z.uuid().optional(),
  ip: z.string().nullable().optional(),
  not_after: z.string().nullable().optional(),
  refreshed_at: z.iso.datetime().nullable().optional(),
  tag: z.string().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  user_id: z.uuid().optional(),
});

export const authSso_domainsRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  domain: z.string(),
  id: z.uuid(),
  sso_provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable(),
});

export const authSso_domainsInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  domain: z.string(),
  id: z.uuid(),
  sso_provider_id: z.uuid(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authSso_domainsUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  domain: z.string().optional(),
  id: z.uuid().optional(),
  sso_provider_id: z.uuid().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authSso_providersRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  disabled: z.boolean().nullable(),
  id: z.uuid(),
  resource_id: z.uuid().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const authSso_providersInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  disabled: z.boolean().nullable().optional(),
  id: z.uuid(),
  resource_id: z.uuid().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authSso_providersUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  disabled: z.boolean().nullable().optional(),
  id: z.uuid().optional(),
  resource_id: z.uuid().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authUsersRowSchema = z.object({
  aud: z.string().min(1).nullable(),
  banned_until: z.string().nullable(),
  confirmation_sent_at: z.iso.datetime().nullable(),
  confirmation_token: z.jwt().nullable(),
  confirmed_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime().nullable(),
  deleted_at: z.iso.datetime().nullable(),
  email: z.email().nullable(),
  email_change: z.email().nullable(),
  email_change_confirm_status: z.number().nullable(),
  email_change_sent_at: z.email().nullable(),
  email_change_token_current: z.email().nullable(),
  email_change_token_new: z.email().nullable(),
  email_confirmed_at: z.email().nullable(),
  encrypted_password: z.string().min(1, "Password cannot be empty").nullable(),
  id: z.uuid(),
  instance_id: z.uuid().nullable(),
  invited_at: z.iso.datetime().nullable(),
  is_anonymous: z.boolean(),
  is_sso_user: z.boolean(),
  is_super_admin: z.boolean().nullable(),
  last_sign_in_at: z.iso.datetime().nullable(),
  phone: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  phone_change: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  phone_change_sent_at: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  phone_change_token: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  phone_confirmed_at: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  raw_app_meta_data: z.any().nullable(),
  raw_user_meta_data: z.any().nullable(),
  reauthentication_sent_at: z.iso.datetime().nullable(),
  reauthentication_token: z.jwt().nullable(),
  recovery_sent_at: z.iso.datetime().nullable(),
  recovery_token: z.jwt().nullable(),
  role: z.enum(UserRole).nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const authUsersInsertSchema = z.object({
  aud: z.string().min(1).nullable().optional(),
  banned_until: z.string().nullable().optional(),
  confirmation_sent_at: z.iso.datetime().nullable().optional(),
  confirmation_token: z.jwt().nullable().optional(),
  confirmed_at: z.iso.datetime().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  deleted_at: z.iso.datetime().nullable().optional(),
  email: z.email().nullable().optional(),
  email_change: z.email().nullable().optional(),
  email_change_confirm_status: z.number().nullable().optional(),
  email_change_sent_at: z.email().nullable().optional(),
  email_change_token_current: z.email().nullable().optional(),
  email_change_token_new: z.email().nullable().optional(),
  email_confirmed_at: z.email().nullable().optional(),
  encrypted_password: z.string().min(1, "Password cannot be empty").nullable().optional(),
  id: z.uuid(),
  instance_id: z.uuid().nullable().optional(),
  invited_at: z.iso.datetime().nullable().optional(),
  is_anonymous: z.boolean().optional(),
  is_sso_user: z.boolean().optional(),
  is_super_admin: z.boolean().nullable().optional(),
  last_sign_in_at: z.iso.datetime().nullable().optional(),
  phone: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_change: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_change_sent_at: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_change_token: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_confirmed_at: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  raw_app_meta_data: z.any().nullable().optional(),
  raw_user_meta_data: z.any().nullable().optional(),
  reauthentication_sent_at: z.iso.datetime().nullable().optional(),
  reauthentication_token: z.jwt().nullable().optional(),
  recovery_sent_at: z.iso.datetime().nullable().optional(),
  recovery_token: z.jwt().nullable().optional(),
  role: z.enum(UserRole).nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const authUsersUpdateSchema = z.object({
  aud: z.string().min(1).nullable().optional(),
  banned_until: z.string().nullable().optional(),
  confirmation_sent_at: z.iso.datetime().nullable().optional(),
  confirmation_token: z.jwt().nullable().optional(),
  confirmed_at: z.iso.datetime().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  deleted_at: z.iso.datetime().nullable().optional(),
  email: z.email().nullable().optional(),
  email_change: z.email().nullable().optional(),
  email_change_confirm_status: z.number().nullable().optional(),
  email_change_sent_at: z.email().nullable().optional(),
  email_change_token_current: z.email().nullable().optional(),
  email_change_token_new: z.email().nullable().optional(),
  email_confirmed_at: z.email().nullable().optional(),
  encrypted_password: z.string().min(1, "Password cannot be empty").nullable().optional(),
  id: z.uuid().optional(),
  instance_id: z.uuid().nullable().optional(),
  invited_at: z.iso.datetime().nullable().optional(),
  is_anonymous: z.boolean().optional(),
  is_sso_user: z.boolean().optional(),
  is_super_admin: z.boolean().nullable().optional(),
  last_sign_in_at: z.iso.datetime().nullable().optional(),
  phone: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_change: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_change_sent_at: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_change_token: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  phone_confirmed_at: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  raw_app_meta_data: z.any().nullable().optional(),
  raw_user_meta_data: z.any().nullable().optional(),
  reauthentication_sent_at: z.iso.datetime().nullable().optional(),
  reauthentication_token: z.jwt().nullable().optional(),
  recovery_sent_at: z.iso.datetime().nullable().optional(),
  recovery_token: z.jwt().nullable().optional(),
  role: z.enum(UserRole).nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const cable_segmentsRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  distance_km: z.number(),
  end_node_id: z.uuid(),
  end_node_type: z.string(),
  fiber_count: z.number().int().min(0),
  id: z.uuid(),
  original_cable_id: z.uuid(),
  segment_order: z.number(),
  start_node_id: z.uuid(),
  start_node_type: z.string(),
  updated_at: z.iso.datetime().nullable(),
});

export const cable_segmentsInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  distance_km: z.number(),
  end_node_id: z.uuid(),
  end_node_type: z.string(),
  fiber_count: z.number().int().min(0),
  id: z.uuid().optional(),
  original_cable_id: z.uuid(),
  segment_order: z.number(),
  start_node_id: z.uuid(),
  start_node_type: z.string(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const cable_segmentsUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  distance_km: z.number().optional(),
  end_node_id: z.uuid().optional(),
  end_node_type: z.string().optional(),
  fiber_count: z.number().int().min(0).optional(),
  id: z.uuid().optional(),
  original_cable_id: z.uuid().optional(),
  segment_order: z.number().optional(),
  start_node_id: z.uuid().optional(),
  start_node_type: z.string().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const employee_designationsRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  parent_id: z.uuid().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const employee_designationsInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  parent_id: z.uuid().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const employee_designationsUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  parent_id: z.uuid().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const employeesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  employee_addr: z.string().min(5, "Address must be at least 5 characters").max(500).nullable(),
  employee_contact: z.string().nullable(),
  employee_designation_id: z.uuid().nullable(),
  employee_dob: z.iso.date().nullable(),
  employee_doj: z.iso.date().nullable(),
  employee_email: z.email().nullable(),
  employee_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  employee_pers_no: z.string().nullable(),
  id: z.uuid(),
  maintenance_terminal_id: z.uuid().nullable(),
  remark: z.string().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const employeesInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  employee_addr: z.string().min(5, "Address must be at least 5 characters").max(500).nullable().optional(),
  employee_contact: z.string().nullable().optional(),
  employee_designation_id: z.uuid().nullable().optional(),
  employee_dob: z.iso.date().nullable().optional(),
  employee_doj: z.iso.date().nullable().optional(),
  employee_email: z.email().nullable().optional(),
  employee_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  employee_pers_no: z.string().nullable().optional(),
  id: z.uuid().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const employeesUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  employee_addr: z.string().min(5, "Address must be at least 5 characters").max(500).nullable().optional(),
  employee_contact: z.string().nullable().optional(),
  employee_designation_id: z.uuid().nullable().optional(),
  employee_dob: z.iso.date().nullable().optional(),
  employee_doj: z.iso.date().nullable().optional(),
  employee_email: z.email().nullable().optional(),
  employee_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  employee_pers_no: z.string().nullable().optional(),
  id: z.uuid().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const fiber_splicesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  incoming_fiber_no: z.number(),
  incoming_segment_id: z.uuid(),
  jc_id: z.uuid(),
  logical_path_id: z.uuid().nullable(),
  loss_db: z.number().nullable(),
  outgoing_fiber_no: z.number().nullable(),
  outgoing_segment_id: z.uuid().nullable(),
  splice_type_id: z.uuid(),
  updated_at: z.iso.datetime().nullable(),
});

export const fiber_splicesInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  incoming_fiber_no: z.number(),
  incoming_segment_id: z.uuid(),
  jc_id: z.uuid(),
  logical_path_id: z.uuid().nullable().optional(),
  loss_db: z.number().nullable().optional(),
  outgoing_fiber_no: z.number().nullable().optional(),
  outgoing_segment_id: z.uuid().nullable().optional(),
  splice_type_id: z.uuid(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const fiber_splicesUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  incoming_fiber_no: z.number().optional(),
  incoming_segment_id: z.uuid().optional(),
  jc_id: z.uuid().optional(),
  logical_path_id: z.uuid().nullable().optional(),
  loss_db: z.number().nullable().optional(),
  outgoing_fiber_no: z.number().nullable().optional(),
  outgoing_segment_id: z.uuid().nullable().optional(),
  splice_type_id: z.uuid().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const filesRowSchema = z.object({
  file_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  file_route: z.string(),
  file_size: z.string(),
  file_type: z.string(),
  file_url: z.url(),
  folder_id: z.uuid().nullable(),
  id: z.uuid(),
  uploaded_at: z.iso.datetime().nullable(),
  user_id: z.uuid(),
});

export const filesInsertSchema = z.object({
  file_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  file_route: z.string(),
  file_size: z.string(),
  file_type: z.string(),
  file_url: z.url(),
  folder_id: z.uuid().nullable().optional(),
  id: z.uuid().optional(),
  uploaded_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid(),
});

export const filesUpdateSchema = z.object({
  file_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  file_route: z.string().optional(),
  file_size: z.string().optional(),
  file_type: z.string().optional(),
  file_url: z.url().optional(),
  folder_id: z.uuid().nullable().optional(),
  id: z.uuid().optional(),
  uploaded_at: z.iso.datetime().nullable().optional(),
  user_id: z.uuid().optional(),
});

export const foldersRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  user_id: z.uuid(),
});

export const foldersInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  user_id: z.uuid(),
});

export const foldersUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  user_id: z.uuid().optional(),
});

export const junction_closuresRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  node_id: z.uuid(),
  ofc_cable_id: z.uuid(),
  position_km: z.number().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const junction_closuresInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  node_id: z.uuid(),
  ofc_cable_id: z.uuid(),
  position_km: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const junction_closuresUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  node_id: z.uuid().optional(),
  ofc_cable_id: z.uuid().optional(),
  position_km: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const logical_fiber_pathsRowSchema = z.object({
  bandwidth_gbps: z.number().nullable(),
  commissioned_date: z.iso.datetime().nullable(),
  created_at: z.iso.datetime().nullable(),
  destination_port: z.string().nullable(),
  destination_system_id: z.uuid().nullable(),
  id: z.uuid(),
  operational_status_id: z.uuid().nullable(),
  path_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  path_role: z.string(),
  path_type_id: z.uuid().nullable(),
  remark: z.string().nullable(),
  service_type: z.string().nullable(),
  source_port: z.string().nullable(),
  source_system_id: z.uuid().nullable(),
  total_distance_km: z.number().nullable(),
  total_loss_db: z.number().nullable(),
  updated_at: z.iso.datetime().nullable(),
  wavelength_nm: z.number().nullable(),
  working_path_id: z.uuid().nullable(),
});

export const logical_fiber_pathsInsertSchema = z.object({
  bandwidth_gbps: z.number().nullable().optional(),
  commissioned_date: z.iso.datetime().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  destination_port: z.string().nullable().optional(),
  destination_system_id: z.uuid().nullable().optional(),
  id: z.uuid().optional(),
  operational_status_id: z.uuid().nullable().optional(),
  path_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  path_role: z.string().optional(),
  path_type_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  service_type: z.string().nullable().optional(),
  source_port: z.string().nullable().optional(),
  source_system_id: z.uuid().nullable().optional(),
  total_distance_km: z.number().nullable().optional(),
  total_loss_db: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  wavelength_nm: z.number().nullable().optional(),
  working_path_id: z.uuid().nullable().optional(),
});

export const logical_fiber_pathsUpdateSchema = z.object({
  bandwidth_gbps: z.number().nullable().optional(),
  commissioned_date: z.iso.datetime().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  destination_port: z.string().nullable().optional(),
  destination_system_id: z.uuid().nullable().optional(),
  id: z.uuid().optional(),
  operational_status_id: z.uuid().nullable().optional(),
  path_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  path_role: z.string().optional(),
  path_type_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  service_type: z.string().nullable().optional(),
  source_port: z.string().nullable().optional(),
  source_system_id: z.uuid().nullable().optional(),
  total_distance_km: z.number().nullable().optional(),
  total_loss_db: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  wavelength_nm: z.number().nullable().optional(),
  working_path_id: z.uuid().nullable().optional(),
});

export const logical_path_segmentsRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  logical_path_id: z.uuid(),
  ofc_cable_id: z.uuid().nullable(),
  path_order: z.number(),
  updated_at: z.iso.datetime().nullable(),
});

export const logical_path_segmentsInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  logical_path_id: z.uuid(),
  ofc_cable_id: z.uuid().nullable().optional(),
  path_order: z.number(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const logical_path_segmentsUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  logical_path_id: z.uuid().optional(),
  ofc_cable_id: z.uuid().nullable().optional(),
  path_order: z.number().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const lookup_typesRowSchema = z.object({
  category: z.string(),
  code: z.string().nullable(),
  created_at: z.iso.datetime().nullable(),
  description: z.string().max(10000, "Text is too long").nullable(),
  id: z.uuid(),
  is_system_default: z.boolean().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  sort_order: z.number().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const lookup_typesInsertSchema = z.object({
  category: z.string(),
  code: z.string().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  description: z.string().max(10000, "Text is too long").nullable().optional(),
  id: z.uuid().optional(),
  is_system_default: z.boolean().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  sort_order: z.number().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const lookup_typesUpdateSchema = z.object({
  category: z.string().optional(),
  code: z.string().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  description: z.string().max(10000, "Text is too long").nullable().optional(),
  id: z.uuid().optional(),
  is_system_default: z.boolean().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  sort_order: z.number().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const maintenance_areasRowSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters").max(500).nullable(),
  area_type_id: z.uuid().nullable(),
  code: z.string().nullable(),
  contact_number: z.string().nullable(),
  contact_person: z.string().nullable(),
  created_at: z.iso.datetime().nullable(),
  email: z.email().nullable(),
  id: z.uuid(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  parent_id: z.uuid().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const maintenance_areasInsertSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters").max(500).nullable().optional(),
  area_type_id: z.uuid().nullable().optional(),
  code: z.string().nullable().optional(),
  contact_number: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  email: z.email().nullable().optional(),
  id: z.uuid().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  parent_id: z.uuid().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const maintenance_areasUpdateSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters").max(500).nullable().optional(),
  area_type_id: z.uuid().nullable().optional(),
  code: z.string().nullable().optional(),
  contact_number: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  email: z.email().nullable().optional(),
  id: z.uuid().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  parent_id: z.uuid().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const management_portsRowSchema = z.object({
  commissioned_on: z.iso.date().nullable(),
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  node_id: z.uuid().nullable(),
  port_no: z.string(),
  remark: z.string().nullable(),
  status: z.boolean().nullable(),
  system_id: z.uuid().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const management_portsInsertSchema = z.object({
  commissioned_on: z.iso.date().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  node_id: z.uuid().nullable().optional(),
  port_no: z.string(),
  remark: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_id: z.uuid().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const management_portsUpdateSchema = z.object({
  commissioned_on: z.iso.date().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  node_id: z.uuid().nullable().optional(),
  port_no: z.string().optional(),
  remark: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_id: z.uuid().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const nodesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  maintenance_terminal_id: z.uuid().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  node_type_id: z.uuid().nullable(),
  remark: z.string().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const nodesInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  node_type_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const nodesUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  node_type_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const ofc_cablesRowSchema = z.object({
  asset_no: z.string().nullable(),
  capacity: z.number(),
  commissioned_on: z.iso.date().nullable(),
  created_at: z.iso.datetime().nullable(),
  current_rkm: z.number().nullable(),
  en_id: z.uuid(),
  id: z.uuid(),
  maintenance_terminal_id: z.uuid().nullable(),
  ofc_owner_id: z.uuid(),
  ofc_type_id: z.uuid(),
  remark: z.string().nullable(),
  route_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  sn_id: z.uuid(),
  status: z.boolean().nullable(),
  transnet_id: z.number().int().positive().nullable(),
  transnet_rkm: z.number().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const ofc_cablesInsertSchema = z.object({
  asset_no: z.string().nullable().optional(),
  capacity: z.number(),
  commissioned_on: z.iso.date().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  current_rkm: z.number().nullable().optional(),
  en_id: z.uuid(),
  id: z.uuid().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  ofc_owner_id: z.uuid(),
  ofc_type_id: z.uuid(),
  remark: z.string().nullable().optional(),
  route_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  sn_id: z.uuid(),
  status: z.boolean().nullable().optional(),
  transnet_id: z.number().int().positive().nullable().optional(),
  transnet_rkm: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const ofc_cablesUpdateSchema = z.object({
  asset_no: z.string().nullable().optional(),
  capacity: z.number().optional(),
  commissioned_on: z.iso.date().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  current_rkm: z.number().nullable().optional(),
  en_id: z.uuid().optional(),
  id: z.uuid().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  ofc_owner_id: z.uuid().optional(),
  ofc_type_id: z.uuid().optional(),
  remark: z.string().nullable().optional(),
  route_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  sn_id: z.uuid().optional(),
  status: z.boolean().nullable().optional(),
  transnet_id: z.number().int().positive().nullable().optional(),
  transnet_rkm: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const ofc_connectionsRowSchema = z.object({
  connection_category: z.string(),
  connection_type: z.string(),
  created_at: z.iso.datetime().nullable(),
  destination_port: z.string().nullable(),
  en_dom: z.iso.date().nullable(),
  en_power_dbm: z.number().nullable(),
  fiber_no_en: z.number(),
  fiber_no_sn: z.number(),
  fiber_role: z.string().nullable(),
  id: z.uuid(),
  logical_path_id: z.uuid().nullable(),
  ofc_id: z.uuid(),
  otdr_distance_en_km: z.number().nullable(),
  otdr_distance_sn_km: z.number().nullable(),
  path_segment_order: z.number().nullable(),
  remark: z.string().nullable(),
  route_loss_db: z.number().nullable(),
  sn_dom: z.iso.date().nullable(),
  sn_power_dbm: z.number().nullable(),
  source_port: z.string().nullable(),
  status: z.boolean().nullable(),
  system_id: z.uuid().nullable(),
  updated_at: z.iso.datetime().nullable(),
  updated_en_id: z.uuid().nullable(),
  updated_fiber_no_en: z.number().nullable(),
  updated_fiber_no_sn: z.number().nullable(),
  updated_sn_id: z.uuid().nullable(),
});

export const ofc_connectionsInsertSchema = z.object({
  connection_category: z.string().optional(),
  connection_type: z.string().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  destination_port: z.string().nullable().optional(),
  en_dom: z.iso.date().nullable().optional(),
  en_power_dbm: z.number().nullable().optional(),
  fiber_no_en: z.number(),
  fiber_no_sn: z.number(),
  fiber_role: z.string().nullable().optional(),
  id: z.uuid().optional(),
  logical_path_id: z.uuid().nullable().optional(),
  ofc_id: z.uuid(),
  otdr_distance_en_km: z.number().nullable().optional(),
  otdr_distance_sn_km: z.number().nullable().optional(),
  path_segment_order: z.number().nullable().optional(),
  remark: z.string().nullable().optional(),
  route_loss_db: z.number().nullable().optional(),
  sn_dom: z.iso.date().nullable().optional(),
  sn_power_dbm: z.number().nullable().optional(),
  source_port: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_id: z.uuid().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  updated_en_id: z.uuid().nullable().optional(),
  updated_fiber_no_en: z.number().nullable().optional(),
  updated_fiber_no_sn: z.number().nullable().optional(),
  updated_sn_id: z.uuid().nullable().optional(),
});

export const ofc_connectionsUpdateSchema = z.object({
  connection_category: z.string().optional(),
  connection_type: z.string().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  destination_port: z.string().nullable().optional(),
  en_dom: z.iso.date().nullable().optional(),
  en_power_dbm: z.number().nullable().optional(),
  fiber_no_en: z.number().optional(),
  fiber_no_sn: z.number().optional(),
  fiber_role: z.string().nullable().optional(),
  id: z.uuid().optional(),
  logical_path_id: z.uuid().nullable().optional(),
  ofc_id: z.uuid().optional(),
  otdr_distance_en_km: z.number().nullable().optional(),
  otdr_distance_sn_km: z.number().nullable().optional(),
  path_segment_order: z.number().nullable().optional(),
  remark: z.string().nullable().optional(),
  route_loss_db: z.number().nullable().optional(),
  sn_dom: z.iso.date().nullable().optional(),
  sn_power_dbm: z.number().nullable().optional(),
  source_port: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_id: z.uuid().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  updated_en_id: z.uuid().nullable().optional(),
  updated_fiber_no_en: z.number().nullable().optional(),
  updated_fiber_no_sn: z.number().nullable().optional(),
  updated_sn_id: z.uuid().nullable().optional(),
});

export const ring_based_systemsRowSchema = z.object({
  maintenance_area_id: z.uuid().nullable(),
  ring_id: z.uuid().nullable(),
  system_id: z.uuid(),
});

export const ring_based_systemsInsertSchema = z.object({
  maintenance_area_id: z.uuid().nullable().optional(),
  ring_id: z.uuid().nullable().optional(),
  system_id: z.uuid(),
});

export const ring_based_systemsUpdateSchema = z.object({
  maintenance_area_id: z.uuid().nullable().optional(),
  ring_id: z.uuid().nullable().optional(),
  system_id: z.uuid().optional(),
});

export const ringsRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  description: z.string().max(10000, "Text is too long").nullable(),
  id: z.uuid(),
  maintenance_terminal_id: z.uuid().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  ring_type_id: z.uuid().nullable(),
  status: z.boolean().nullable(),
  total_nodes: z.number().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const ringsInsertSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  description: z.string().max(10000, "Text is too long").nullable().optional(),
  id: z.uuid().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  ring_type_id: z.uuid().nullable().optional(),
  status: z.boolean().nullable().optional(),
  total_nodes: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const ringsUpdateSchema = z.object({
  created_at: z.iso.datetime().nullable().optional(),
  description: z.string().max(10000, "Text is too long").nullable().optional(),
  id: z.uuid().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  ring_type_id: z.uuid().nullable().optional(),
  status: z.boolean().nullable().optional(),
  total_nodes: z.number().nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const sdh_connectionsRowSchema = z.object({
  a_customer: z.string().nullable(),
  a_slot: z.string().nullable(),
  b_customer: z.string().nullable(),
  b_slot: z.string().nullable(),
  carrier: z.string().nullable(),
  stm_no: z.string().nullable(),
  system_connection_id: z.uuid(),
});

export const sdh_connectionsInsertSchema = z.object({
  a_customer: z.string().nullable().optional(),
  a_slot: z.string().nullable().optional(),
  b_customer: z.string().nullable().optional(),
  b_slot: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  stm_no: z.string().nullable().optional(),
  system_connection_id: z.uuid(),
});

export const sdh_connectionsUpdateSchema = z.object({
  a_customer: z.string().nullable().optional(),
  a_slot: z.string().nullable().optional(),
  b_customer: z.string().nullable().optional(),
  b_slot: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  stm_no: z.string().nullable().optional(),
  system_connection_id: z.uuid().optional(),
});

export const sdh_node_associationsRowSchema = z.object({
  id: z.uuid(),
  node_id: z.uuid(),
  node_ip: z.string().nullable(),
  node_position: z.string().nullable(),
  sdh_system_id: z.uuid(),
});

export const sdh_node_associationsInsertSchema = z.object({
  id: z.uuid().optional(),
  node_id: z.uuid(),
  node_ip: z.string().nullable().optional(),
  node_position: z.string().nullable().optional(),
  sdh_system_id: z.uuid(),
});

export const sdh_node_associationsUpdateSchema = z.object({
  id: z.uuid().optional(),
  node_id: z.uuid().optional(),
  node_ip: z.string().nullable().optional(),
  node_position: z.string().nullable().optional(),
  sdh_system_id: z.uuid().optional(),
});

export const sdh_systemsRowSchema = z.object({
  gne: z.string().nullable(),
  system_id: z.uuid(),
});

export const sdh_systemsInsertSchema = z.object({
  gne: z.string().nullable().optional(),
  system_id: z.uuid(),
});

export const sdh_systemsUpdateSchema = z.object({
  gne: z.string().nullable().optional(),
  system_id: z.uuid().optional(),
});

export const sfp_based_connectionsRowSchema = z.object({
  bandwidth_allocated_mbps: z.number().nullable(),
  customer_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  fiber_in: z.number().nullable(),
  fiber_out: z.number().nullable(),
  sfp_capacity: z.string().nullable(),
  sfp_port: z.string().nullable(),
  sfp_serial_no: z.string().nullable(),
  sfp_type_id: z.uuid().nullable(),
  system_connection_id: z.uuid(),
});

export const sfp_based_connectionsInsertSchema = z.object({
  bandwidth_allocated_mbps: z.number().nullable().optional(),
  customer_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  fiber_in: z.number().nullable().optional(),
  fiber_out: z.number().nullable().optional(),
  sfp_capacity: z.string().nullable().optional(),
  sfp_port: z.string().nullable().optional(),
  sfp_serial_no: z.string().nullable().optional(),
  sfp_type_id: z.uuid().nullable().optional(),
  system_connection_id: z.uuid(),
});

export const sfp_based_connectionsUpdateSchema = z.object({
  bandwidth_allocated_mbps: z.number().nullable().optional(),
  customer_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  fiber_in: z.number().nullable().optional(),
  fiber_out: z.number().nullable().optional(),
  sfp_capacity: z.string().nullable().optional(),
  sfp_port: z.string().nullable().optional(),
  sfp_serial_no: z.string().nullable().optional(),
  sfp_type_id: z.uuid().nullable().optional(),
  system_connection_id: z.uuid().optional(),
});

export const system_connectionsRowSchema = z.object({
  bandwidth_mbps: z.number().nullable(),
  commissioned_on: z.iso.date().nullable(),
  connected_system_id: z.uuid().nullable(),
  created_at: z.iso.datetime().nullable(),
  en_id: z.uuid().nullable(),
  en_interface: z.string().nullable(),
  en_ip: z.string().nullable(),
  id: z.uuid(),
  media_type_id: z.uuid().nullable(),
  remark: z.string().nullable(),
  sn_id: z.uuid().nullable(),
  sn_interface: z.string().nullable(),
  sn_ip: z.string().nullable(),
  status: z.boolean().nullable(),
  system_id: z.uuid(),
  updated_at: z.iso.datetime().nullable(),
  vlan: z.string().nullable(),
});

export const system_connectionsInsertSchema = z.object({
  bandwidth_mbps: z.number().nullable().optional(),
  commissioned_on: z.iso.date().nullable().optional(),
  connected_system_id: z.uuid().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  en_id: z.uuid().nullable().optional(),
  en_interface: z.string().nullable().optional(),
  en_ip: z.string().nullable().optional(),
  id: z.uuid().optional(),
  media_type_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  sn_id: z.uuid().nullable().optional(),
  sn_interface: z.string().nullable().optional(),
  sn_ip: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_id: z.uuid(),
  updated_at: z.iso.datetime().nullable().optional(),
  vlan: z.string().nullable().optional(),
});

export const system_connectionsUpdateSchema = z.object({
  bandwidth_mbps: z.number().nullable().optional(),
  commissioned_on: z.iso.date().nullable().optional(),
  connected_system_id: z.uuid().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  en_id: z.uuid().nullable().optional(),
  en_interface: z.string().nullable().optional(),
  en_ip: z.string().nullable().optional(),
  id: z.uuid().optional(),
  media_type_id: z.uuid().nullable().optional(),
  remark: z.string().nullable().optional(),
  sn_id: z.uuid().nullable().optional(),
  sn_interface: z.string().nullable().optional(),
  sn_ip: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_id: z.uuid().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
  vlan: z.string().nullable().optional(),
});

export const systemsRowSchema = z.object({
  commissioned_on: z.iso.date().nullable(),
  created_at: z.iso.datetime().nullable(),
  id: z.uuid(),
  ip_address: z.string().nullable(),
  maintenance_terminal_id: z.uuid().nullable(),
  make: z.string().nullable(),
  node_id: z.uuid(),
  remark: z.string().nullable(),
  s_no: z.string().nullable(),
  status: z.boolean().nullable(),
  system_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  system_type_id: z.uuid(),
  updated_at: z.iso.datetime().nullable(),
});

export const systemsInsertSchema = z.object({
  commissioned_on: z.iso.date().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  ip_address: z.string().nullable().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  make: z.string().nullable().optional(),
  node_id: z.uuid(),
  remark: z.string().nullable().optional(),
  s_no: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  system_type_id: z.uuid(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const systemsUpdateSchema = z.object({
  commissioned_on: z.iso.date().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  id: z.uuid().optional(),
  ip_address: z.string().nullable().optional(),
  maintenance_terminal_id: z.uuid().nullable().optional(),
  make: z.string().nullable().optional(),
  node_id: z.uuid().optional(),
  remark: z.string().nullable().optional(),
  s_no: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  system_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable().optional(),
  system_type_id: z.uuid().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const user_profilesRowSchema = z.object({
  address: z.any().nullable(),
  avatar_url: z.url().nullable(),
  created_at: z.iso.datetime().nullable(),
  date_of_birth: z.iso.date().nullable(),
  designation: z.string().nullable(),
  first_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  id: z.uuid(),
  last_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  phone_number: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  preferences: z.any().nullable(),
  role: z.enum(UserRole).nullable(),
  status: z.string().min(1, "Status cannot be empty").nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const user_profilesInsertSchema = z.object({
  address: z.any().nullable().optional(),
  avatar_url: z.url().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  date_of_birth: z.iso.date().nullable().optional(),
  designation: z.string().nullable().optional(),
  first_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  id: z.uuid(),
  last_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long"),
  phone_number: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  preferences: z.any().nullable().optional(),
  role: z.enum(UserRole).nullable().optional(),
  status: z.string().min(1, "Status cannot be empty").nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const user_profilesUpdateSchema = z.object({
  address: z.any().nullable().optional(),
  avatar_url: z.url().nullable().optional(),
  created_at: z.iso.datetime().nullable().optional(),
  date_of_birth: z.iso.date().nullable().optional(),
  designation: z.string().nullable().optional(),
  first_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  id: z.uuid().optional(),
  last_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").optional(),
  phone_number: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable().optional(),
  preferences: z.any().nullable().optional(),
  role: z.enum(UserRole).nullable().optional(),
  status: z.string().min(1, "Status cannot be empty").nullable().optional(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const vmux_connectionsRowSchema = z.object({
  c_code: z.string().nullable(),
  channel: z.string().nullable(),
  subscriber: z.string().nullable(),
  system_connection_id: z.uuid(),
  tk: z.string().nullable(),
});

export const vmux_connectionsInsertSchema = z.object({
  c_code: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  subscriber: z.string().nullable().optional(),
  system_connection_id: z.uuid(),
  tk: z.string().nullable().optional(),
});

export const vmux_connectionsUpdateSchema = z.object({
  c_code: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  subscriber: z.string().nullable().optional(),
  system_connection_id: z.uuid().optional(),
  tk: z.string().nullable().optional(),
});

export const vmux_systemsRowSchema = z.object({
  system_id: z.uuid(),
  vm_id: z.uuid().nullable(),
});

export const vmux_systemsInsertSchema = z.object({
  system_id: z.uuid(),
  vm_id: z.uuid().nullable().optional(),
});

export const vmux_systemsUpdateSchema = z.object({
  system_id: z.uuid().optional(),
  vm_id: z.uuid().nullable().optional(),
});

export const v_cable_segments_at_jcRowSchema = z.object({
  end_node_id: z.uuid().nullable(),
  fiber_count: z.number().int().min(0).nullable(),
  id: z.uuid().nullable(),
  jc_node_id: z.uuid().nullable(),
  original_cable_id: z.uuid().nullable(),
  segment_order: z.number().nullable(),
  start_node_id: z.uuid().nullable(),
});

export const v_cable_utilizationRowSchema = z.object({
  available_fibers: z.number().nullable(),
  cable_id: z.uuid().nullable(),
  capacity: z.number().nullable(),
  route_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  used_fibers: z.number().nullable(),
  utilization_percent: z.number().min(0).max(100).nullable(),
});

export const v_employee_designationsRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  parent_id: z.uuid().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const v_employeesRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  employee_addr: z.string().min(5, "Address must be at least 5 characters").max(500).nullable(),
  employee_contact: z.string().nullable(),
  employee_designation_id: z.uuid().nullable(),
  employee_designation_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  employee_dob: z.iso.date().nullable(),
  employee_doj: z.iso.date().nullable(),
  employee_email: z.email().nullable(),
  employee_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  employee_pers_no: z.string().nullable(),
  id: z.uuid().nullable(),
  maintenance_terminal_id: z.uuid().nullable(),
  remark: z.string().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const v_end_to_end_pathsRowSchema = z.object({
  destination_system_id: z.uuid().nullable(),
  operational_status: z.string().min(1, "Status cannot be empty").nullable(),
  path_id: z.uuid().nullable(),
  path_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  route_names: z.string().nullable(),
  segment_count: z.number().int().min(0).nullable(),
  source_system_id: z.uuid().nullable(),
  total_distance_km: z.number().nullable(),
  total_loss_db: z.number().nullable(),
});

export const v_junction_closures_completeRowSchema = z.object({
  id: z.uuid().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  node_id: z.uuid().nullable(),
  ofc_cable_id: z.uuid().nullable(),
  position_km: z.number().nullable(),
});

export const v_lookup_typesRowSchema = z.object({
  category: z.string().nullable(),
  code: z.string().nullable(),
  created_at: z.iso.datetime().nullable(),
  description: z.string().max(10000, "Text is too long").nullable(),
  id: z.uuid().nullable(),
  is_system_default: z.boolean().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  sort_order: z.number().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const v_maintenance_areasRowSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters").max(500).nullable(),
  area_type_id: z.uuid().nullable(),
  code: z.string().nullable(),
  contact_number: z.string().nullable(),
  contact_person: z.string().nullable(),
  created_at: z.iso.datetime().nullable(),
  email: z.email().nullable(),
  id: z.uuid().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  maintenance_area_type_code: z.string().nullable(),
  maintenance_area_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  parent_id: z.uuid().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const v_nodes_completeRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  id: z.uuid().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  maintenance_area_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  maintenance_terminal_id: z.uuid().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  node_type_code: z.string().nullable(),
  node_type_id: z.uuid().nullable(),
  node_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  remark: z.string().nullable(),
  status: z.boolean().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const v_ofc_cables_completeRowSchema = z.object({
  asset_no: z.string().nullable(),
  capacity: z.number().nullable(),
  commissioned_on: z.iso.date().nullable(),
  created_at: z.iso.datetime().nullable(),
  current_rkm: z.number().nullable(),
  en_id: z.uuid().nullable(),
  en_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  en_node_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  id: z.uuid().nullable(),
  maintenance_area_code: z.string().nullable(),
  maintenance_area_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  maintenance_terminal_id: z.uuid().nullable(),
  ofc_owner_code: z.string().nullable(),
  ofc_owner_id: z.uuid().nullable(),
  ofc_owner_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  ofc_type_code: z.string().nullable(),
  ofc_type_id: z.uuid().nullable(),
  ofc_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  remark: z.string().nullable(),
  route_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  sn_id: z.uuid().nullable(),
  sn_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  sn_node_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  status: z.boolean().nullable(),
  transnet_id: z.number().int().positive().nullable(),
  transnet_rkm: z.number().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const v_ofc_connections_completeRowSchema = z.object({
  connection_category: z.string().nullable(),
  connection_type: z.string().nullable(),
  created_at: z.iso.datetime().nullable(),
  destination_port: z.string().nullable(),
  en_dom: z.iso.date().nullable(),
  en_id: z.uuid().nullable(),
  en_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  en_power_dbm: z.number().nullable(),
  fiber_no_en: z.number().nullable(),
  fiber_no_sn: z.number().nullable(),
  fiber_role: z.string().nullable(),
  id: z.uuid().nullable(),
  logical_path_id: z.uuid().nullable(),
  maintenance_area_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  ofc_id: z.uuid().nullable(),
  ofc_route_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  ofc_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  otdr_distance_en_km: z.number().nullable(),
  otdr_distance_sn_km: z.number().nullable(),
  path_segment_order: z.number().nullable(),
  remark: z.string().nullable(),
  route_loss_db: z.number().nullable(),
  sn_dom: z.iso.date().nullable(),
  sn_id: z.uuid().nullable(),
  sn_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  sn_power_dbm: z.number().nullable(),
  source_port: z.string().nullable(),
  status: z.boolean().nullable(),
  system_id: z.uuid().nullable(),
  system_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  updated_at: z.iso.datetime().nullable(),
  updated_en_id: z.uuid().nullable(),
  updated_fiber_no_en: z.number().nullable(),
  updated_fiber_no_sn: z.number().nullable(),
  updated_sn_id: z.uuid().nullable(),
});

export const v_ring_nodesRowSchema = z.object({
  id: z.uuid().nullable(),
  ip: z.ipv4().nullable(),
  lat: z.number().nullable(),
  long: z.number().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  order_in_ring: z.number().nullable(),
  remark: z.string().nullable(),
  ring_id: z.uuid().nullable(),
  ring_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  ring_status: z.boolean().nullable(),
  system_status: z.boolean().nullable(),
  type: z.string().nullable(),
});

export const v_ringsRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  description: z.string().max(10000, "Text is too long").nullable(),
  id: z.uuid().nullable(),
  maintenance_area_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  maintenance_terminal_id: z.uuid().nullable(),
  name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  ring_type_code: z.string().nullable(),
  ring_type_id: z.uuid().nullable(),
  ring_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  status: z.boolean().nullable(),
  total_nodes: z.number().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const v_system_connections_completeRowSchema = z.object({
  bandwidth_allocated_mbps: z.number().nullable(),
  bandwidth_mbps: z.number().nullable(),
  commissioned_on: z.iso.date().nullable(),
  connected_system_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  connected_system_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  created_at: z.iso.datetime().nullable(),
  customer_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  en_interface: z.string().nullable(),
  en_ip: z.string().nullable(),
  en_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  en_node_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  fiber_in: z.number().nullable(),
  fiber_out: z.number().nullable(),
  id: z.uuid().nullable(),
  media_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  remark: z.string().nullable(),
  sdh_a_customer: z.string().nullable(),
  sdh_a_slot: z.string().nullable(),
  sdh_b_customer: z.string().nullable(),
  sdh_b_slot: z.string().nullable(),
  sdh_carrier: z.string().nullable(),
  sdh_stm_no: z.string().nullable(),
  sfp_capacity: z.string().nullable(),
  sfp_port: z.string().nullable(),
  sfp_serial_no: z.string().nullable(),
  sfp_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  sn_interface: z.string().nullable(),
  sn_ip: z.string().nullable(),
  sn_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  sn_node_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  status: z.boolean().nullable(),
  system_id: z.uuid().nullable(),
  system_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  system_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  updated_at: z.iso.datetime().nullable(),
  vlan: z.string().nullable(),
  vmux_c_code: z.string().nullable(),
  vmux_channel: z.string().nullable(),
  vmux_subscriber: z.string().nullable(),
  vmux_tk: z.string().nullable(),
});

export const v_system_ring_paths_detailedRowSchema = z.object({
  created_at: z.iso.datetime().nullable(),
  end_node_id: z.uuid().nullable(),
  end_node_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  id: z.uuid().nullable(),
  logical_path_id: z.uuid().nullable(),
  ofc_cable_id: z.uuid().nullable(),
  path_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  path_order: z.number().nullable(),
  route_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  source_system_id: z.uuid().nullable(),
  start_node_id: z.uuid().nullable(),
  start_node_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
});

export const v_systems_completeRowSchema = z.object({
  commissioned_on: z.iso.date().nullable(),
  created_at: z.iso.datetime().nullable(),
  id: z.uuid().nullable(),
  ip_address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  maintenance_terminal_id: z.uuid().nullable(),
  make: z.string().nullable(),
  node_id: z.uuid().nullable(),
  node_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  node_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  remark: z.string().nullable(),
  ring_id: z.uuid().nullable(),
  ring_logical_area_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  s_no: z.string().nullable(),
  sdh_gne: z.string().nullable(),
  status: z.boolean().nullable(),
  system_category: z.string().nullable(),
  system_maintenance_terminal_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  system_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  system_type_code: z.string().nullable(),
  system_type_id: z.uuid().nullable(),
  system_type_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  updated_at: z.iso.datetime().nullable(),
  vmux_vm_id: z.uuid().nullable(),
});

export const v_user_profiles_extendedRowSchema = z.object({
  account_age_days: z.number().int().min(0).max(150).nullable(),
  address: z.any().nullable(),
  auth_updated_at: z.iso.datetime().nullable(),
  avatar_url: z.url().nullable(),
  computed_status: z.string().min(1, "Status cannot be empty").nullable(),
  created_at: z.iso.datetime().nullable(),
  date_of_birth: z.iso.date().nullable(),
  designation: z.string().nullable(),
  email: z.email().nullable(),
  email_confirmed_at: z.email().nullable(),
  first_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  full_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  id: z.uuid().nullable(),
  is_email_verified: z.boolean().nullable(),
  is_phone_verified: z.boolean().nullable(),
  is_super_admin: z.boolean().nullable(),
  last_activity_period: z.string().nullable(),
  last_name: z.string().min(1, "Name cannot be empty").max(255, "Name is too long").nullable(),
  last_sign_in_at: z.iso.datetime().nullable(),
  phone_confirmed_at: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  phone_number: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number").nullable(),
  preferences: z.any().nullable(),
  raw_app_meta_data: z.any().nullable(),
  raw_user_meta_data: z.any().nullable(),
  role: z.enum(UserRole).nullable(),
  status: z.string().min(1, "Status cannot be empty").nullable(),
  updated_at: z.iso.datetime().nullable(),
});

// ============= CONVENIENCE EXPORTS =============

export const schemas = {
  authAudit_log_entriesRowSchema,
  authAudit_log_entriesInsertSchema,
  authAudit_log_entriesUpdateSchema,
  authFlow_stateRowSchema,
  authFlow_stateInsertSchema,
  authFlow_stateUpdateSchema,
  authIdentitiesRowSchema,
  authIdentitiesInsertSchema,
  authIdentitiesUpdateSchema,
  authInstancesRowSchema,
  authInstancesInsertSchema,
  authInstancesUpdateSchema,
  authMfa_amr_claimsRowSchema,
  authMfa_amr_claimsInsertSchema,
  authMfa_amr_claimsUpdateSchema,
  authMfa_challengesRowSchema,
  authMfa_challengesInsertSchema,
  authMfa_challengesUpdateSchema,
  authMfa_factorsRowSchema,
  authMfa_factorsInsertSchema,
  authMfa_factorsUpdateSchema,
  authOauth_clientsRowSchema,
  authOauth_clientsInsertSchema,
  authOauth_clientsUpdateSchema,
  authOne_time_tokensRowSchema,
  authOne_time_tokensInsertSchema,
  authOne_time_tokensUpdateSchema,
  authRefresh_tokensRowSchema,
  authRefresh_tokensInsertSchema,
  authRefresh_tokensUpdateSchema,
  authSaml_providersRowSchema,
  authSaml_providersInsertSchema,
  authSaml_providersUpdateSchema,
  authSaml_relay_statesRowSchema,
  authSaml_relay_statesInsertSchema,
  authSaml_relay_statesUpdateSchema,
  authSchema_migrationsRowSchema,
  authSchema_migrationsInsertSchema,
  authSchema_migrationsUpdateSchema,
  authSessionsRowSchema,
  authSessionsInsertSchema,
  authSessionsUpdateSchema,
  authSso_domainsRowSchema,
  authSso_domainsInsertSchema,
  authSso_domainsUpdateSchema,
  authSso_providersRowSchema,
  authSso_providersInsertSchema,
  authSso_providersUpdateSchema,
  authUsersRowSchema,
  authUsersInsertSchema,
  authUsersUpdateSchema,
  cable_segmentsRowSchema,
  cable_segmentsInsertSchema,
  cable_segmentsUpdateSchema,
  employee_designationsRowSchema,
  employee_designationsInsertSchema,
  employee_designationsUpdateSchema,
  employeesRowSchema,
  employeesInsertSchema,
  employeesUpdateSchema,
  fiber_splicesRowSchema,
  fiber_splicesInsertSchema,
  fiber_splicesUpdateSchema,
  filesRowSchema,
  filesInsertSchema,
  filesUpdateSchema,
  foldersRowSchema,
  foldersInsertSchema,
  foldersUpdateSchema,
  junction_closuresRowSchema,
  junction_closuresInsertSchema,
  junction_closuresUpdateSchema,
  logical_fiber_pathsRowSchema,
  logical_fiber_pathsInsertSchema,
  logical_fiber_pathsUpdateSchema,
  logical_path_segmentsRowSchema,
  logical_path_segmentsInsertSchema,
  logical_path_segmentsUpdateSchema,
  lookup_typesRowSchema,
  lookup_typesInsertSchema,
  lookup_typesUpdateSchema,
  maintenance_areasRowSchema,
  maintenance_areasInsertSchema,
  maintenance_areasUpdateSchema,
  management_portsRowSchema,
  management_portsInsertSchema,
  management_portsUpdateSchema,
  nodesRowSchema,
  nodesInsertSchema,
  nodesUpdateSchema,
  ofc_cablesRowSchema,
  ofc_cablesInsertSchema,
  ofc_cablesUpdateSchema,
  ofc_connectionsRowSchema,
  ofc_connectionsInsertSchema,
  ofc_connectionsUpdateSchema,
  ring_based_systemsRowSchema,
  ring_based_systemsInsertSchema,
  ring_based_systemsUpdateSchema,
  ringsRowSchema,
  ringsInsertSchema,
  ringsUpdateSchema,
  sdh_connectionsRowSchema,
  sdh_connectionsInsertSchema,
  sdh_connectionsUpdateSchema,
  sdh_node_associationsRowSchema,
  sdh_node_associationsInsertSchema,
  sdh_node_associationsUpdateSchema,
  sdh_systemsRowSchema,
  sdh_systemsInsertSchema,
  sdh_systemsUpdateSchema,
  sfp_based_connectionsRowSchema,
  sfp_based_connectionsInsertSchema,
  sfp_based_connectionsUpdateSchema,
  system_connectionsRowSchema,
  system_connectionsInsertSchema,
  system_connectionsUpdateSchema,
  systemsRowSchema,
  systemsInsertSchema,
  systemsUpdateSchema,
  user_profilesRowSchema,
  user_profilesInsertSchema,
  user_profilesUpdateSchema,
  vmux_connectionsRowSchema,
  vmux_connectionsInsertSchema,
  vmux_connectionsUpdateSchema,
  vmux_systemsRowSchema,
  vmux_systemsInsertSchema,
  vmux_systemsUpdateSchema,
  v_cable_segments_at_jcRowSchema,
  v_cable_utilizationRowSchema,
  v_employee_designationsRowSchema,
  v_employeesRowSchema,
  v_end_to_end_pathsRowSchema,
  v_junction_closures_completeRowSchema,
  v_lookup_typesRowSchema,
  v_maintenance_areasRowSchema,
  v_nodes_completeRowSchema,
  v_ofc_cables_completeRowSchema,
  v_ofc_connections_completeRowSchema,
  v_ring_nodesRowSchema,
  v_ringsRowSchema,
  v_system_connections_completeRowSchema,
  v_system_ring_paths_detailedRowSchema,
  v_systems_completeRowSchema,
  v_user_profiles_extendedRowSchema,
} as const;

// ============= TYPE EXPORTS =============

export type AuthAudit_log_entriesRowSchema = z.infer<typeof authAudit_log_entriesRowSchema>;
export type AuthAudit_log_entriesInsertSchema = z.infer<typeof authAudit_log_entriesInsertSchema>;
export type AuthAudit_log_entriesUpdateSchema = z.infer<typeof authAudit_log_entriesUpdateSchema>;
export type AuthFlow_stateRowSchema = z.infer<typeof authFlow_stateRowSchema>;
export type AuthFlow_stateInsertSchema = z.infer<typeof authFlow_stateInsertSchema>;
export type AuthFlow_stateUpdateSchema = z.infer<typeof authFlow_stateUpdateSchema>;
export type AuthIdentitiesRowSchema = z.infer<typeof authIdentitiesRowSchema>;
export type AuthIdentitiesInsertSchema = z.infer<typeof authIdentitiesInsertSchema>;
export type AuthIdentitiesUpdateSchema = z.infer<typeof authIdentitiesUpdateSchema>;
export type AuthInstancesRowSchema = z.infer<typeof authInstancesRowSchema>;
export type AuthInstancesInsertSchema = z.infer<typeof authInstancesInsertSchema>;
export type AuthInstancesUpdateSchema = z.infer<typeof authInstancesUpdateSchema>;
export type AuthMfa_amr_claimsRowSchema = z.infer<typeof authMfa_amr_claimsRowSchema>;
export type AuthMfa_amr_claimsInsertSchema = z.infer<typeof authMfa_amr_claimsInsertSchema>;
export type AuthMfa_amr_claimsUpdateSchema = z.infer<typeof authMfa_amr_claimsUpdateSchema>;
export type AuthMfa_challengesRowSchema = z.infer<typeof authMfa_challengesRowSchema>;
export type AuthMfa_challengesInsertSchema = z.infer<typeof authMfa_challengesInsertSchema>;
export type AuthMfa_challengesUpdateSchema = z.infer<typeof authMfa_challengesUpdateSchema>;
export type AuthMfa_factorsRowSchema = z.infer<typeof authMfa_factorsRowSchema>;
export type AuthMfa_factorsInsertSchema = z.infer<typeof authMfa_factorsInsertSchema>;
export type AuthMfa_factorsUpdateSchema = z.infer<typeof authMfa_factorsUpdateSchema>;
export type AuthOauth_clientsRowSchema = z.infer<typeof authOauth_clientsRowSchema>;
export type AuthOauth_clientsInsertSchema = z.infer<typeof authOauth_clientsInsertSchema>;
export type AuthOauth_clientsUpdateSchema = z.infer<typeof authOauth_clientsUpdateSchema>;
export type AuthOne_time_tokensRowSchema = z.infer<typeof authOne_time_tokensRowSchema>;
export type AuthOne_time_tokensInsertSchema = z.infer<typeof authOne_time_tokensInsertSchema>;
export type AuthOne_time_tokensUpdateSchema = z.infer<typeof authOne_time_tokensUpdateSchema>;
export type AuthRefresh_tokensRowSchema = z.infer<typeof authRefresh_tokensRowSchema>;
export type AuthRefresh_tokensInsertSchema = z.infer<typeof authRefresh_tokensInsertSchema>;
export type AuthRefresh_tokensUpdateSchema = z.infer<typeof authRefresh_tokensUpdateSchema>;
export type AuthSaml_providersRowSchema = z.infer<typeof authSaml_providersRowSchema>;
export type AuthSaml_providersInsertSchema = z.infer<typeof authSaml_providersInsertSchema>;
export type AuthSaml_providersUpdateSchema = z.infer<typeof authSaml_providersUpdateSchema>;
export type AuthSaml_relay_statesRowSchema = z.infer<typeof authSaml_relay_statesRowSchema>;
export type AuthSaml_relay_statesInsertSchema = z.infer<typeof authSaml_relay_statesInsertSchema>;
export type AuthSaml_relay_statesUpdateSchema = z.infer<typeof authSaml_relay_statesUpdateSchema>;
export type AuthSchema_migrationsRowSchema = z.infer<typeof authSchema_migrationsRowSchema>;
export type AuthSchema_migrationsInsertSchema = z.infer<typeof authSchema_migrationsInsertSchema>;
export type AuthSchema_migrationsUpdateSchema = z.infer<typeof authSchema_migrationsUpdateSchema>;
export type AuthSessionsRowSchema = z.infer<typeof authSessionsRowSchema>;
export type AuthSessionsInsertSchema = z.infer<typeof authSessionsInsertSchema>;
export type AuthSessionsUpdateSchema = z.infer<typeof authSessionsUpdateSchema>;
export type AuthSso_domainsRowSchema = z.infer<typeof authSso_domainsRowSchema>;
export type AuthSso_domainsInsertSchema = z.infer<typeof authSso_domainsInsertSchema>;
export type AuthSso_domainsUpdateSchema = z.infer<typeof authSso_domainsUpdateSchema>;
export type AuthSso_providersRowSchema = z.infer<typeof authSso_providersRowSchema>;
export type AuthSso_providersInsertSchema = z.infer<typeof authSso_providersInsertSchema>;
export type AuthSso_providersUpdateSchema = z.infer<typeof authSso_providersUpdateSchema>;
export type AuthUsersRowSchema = z.infer<typeof authUsersRowSchema>;
export type AuthUsersInsertSchema = z.infer<typeof authUsersInsertSchema>;
export type AuthUsersUpdateSchema = z.infer<typeof authUsersUpdateSchema>;
export type Cable_segmentsRowSchema = z.infer<typeof cable_segmentsRowSchema>;
export type Cable_segmentsInsertSchema = z.infer<typeof cable_segmentsInsertSchema>;
export type Cable_segmentsUpdateSchema = z.infer<typeof cable_segmentsUpdateSchema>;
export type Employee_designationsRowSchema = z.infer<typeof employee_designationsRowSchema>;
export type Employee_designationsInsertSchema = z.infer<typeof employee_designationsInsertSchema>;
export type Employee_designationsUpdateSchema = z.infer<typeof employee_designationsUpdateSchema>;
export type EmployeesRowSchema = z.infer<typeof employeesRowSchema>;
export type EmployeesInsertSchema = z.infer<typeof employeesInsertSchema>;
export type EmployeesUpdateSchema = z.infer<typeof employeesUpdateSchema>;
export type Fiber_splicesRowSchema = z.infer<typeof fiber_splicesRowSchema>;
export type Fiber_splicesInsertSchema = z.infer<typeof fiber_splicesInsertSchema>;
export type Fiber_splicesUpdateSchema = z.infer<typeof fiber_splicesUpdateSchema>;
export type FilesRowSchema = z.infer<typeof filesRowSchema>;
export type FilesInsertSchema = z.infer<typeof filesInsertSchema>;
export type FilesUpdateSchema = z.infer<typeof filesUpdateSchema>;
export type FoldersRowSchema = z.infer<typeof foldersRowSchema>;
export type FoldersInsertSchema = z.infer<typeof foldersInsertSchema>;
export type FoldersUpdateSchema = z.infer<typeof foldersUpdateSchema>;
export type Junction_closuresRowSchema = z.infer<typeof junction_closuresRowSchema>;
export type Junction_closuresInsertSchema = z.infer<typeof junction_closuresInsertSchema>;
export type Junction_closuresUpdateSchema = z.infer<typeof junction_closuresUpdateSchema>;
export type Logical_fiber_pathsRowSchema = z.infer<typeof logical_fiber_pathsRowSchema>;
export type Logical_fiber_pathsInsertSchema = z.infer<typeof logical_fiber_pathsInsertSchema>;
export type Logical_fiber_pathsUpdateSchema = z.infer<typeof logical_fiber_pathsUpdateSchema>;
export type Logical_path_segmentsRowSchema = z.infer<typeof logical_path_segmentsRowSchema>;
export type Logical_path_segmentsInsertSchema = z.infer<typeof logical_path_segmentsInsertSchema>;
export type Logical_path_segmentsUpdateSchema = z.infer<typeof logical_path_segmentsUpdateSchema>;
export type Lookup_typesRowSchema = z.infer<typeof lookup_typesRowSchema>;
export type Lookup_typesInsertSchema = z.infer<typeof lookup_typesInsertSchema>;
export type Lookup_typesUpdateSchema = z.infer<typeof lookup_typesUpdateSchema>;
export type Maintenance_areasRowSchema = z.infer<typeof maintenance_areasRowSchema>;
export type Maintenance_areasInsertSchema = z.infer<typeof maintenance_areasInsertSchema>;
export type Maintenance_areasUpdateSchema = z.infer<typeof maintenance_areasUpdateSchema>;
export type Management_portsRowSchema = z.infer<typeof management_portsRowSchema>;
export type Management_portsInsertSchema = z.infer<typeof management_portsInsertSchema>;
export type Management_portsUpdateSchema = z.infer<typeof management_portsUpdateSchema>;
export type NodesRowSchema = z.infer<typeof nodesRowSchema>;
export type NodesInsertSchema = z.infer<typeof nodesInsertSchema>;
export type NodesUpdateSchema = z.infer<typeof nodesUpdateSchema>;
export type Ofc_cablesRowSchema = z.infer<typeof ofc_cablesRowSchema>;
export type Ofc_cablesInsertSchema = z.infer<typeof ofc_cablesInsertSchema>;
export type Ofc_cablesUpdateSchema = z.infer<typeof ofc_cablesUpdateSchema>;
export type Ofc_connectionsRowSchema = z.infer<typeof ofc_connectionsRowSchema>;
export type Ofc_connectionsInsertSchema = z.infer<typeof ofc_connectionsInsertSchema>;
export type Ofc_connectionsUpdateSchema = z.infer<typeof ofc_connectionsUpdateSchema>;
export type Ring_based_systemsRowSchema = z.infer<typeof ring_based_systemsRowSchema>;
export type Ring_based_systemsInsertSchema = z.infer<typeof ring_based_systemsInsertSchema>;
export type Ring_based_systemsUpdateSchema = z.infer<typeof ring_based_systemsUpdateSchema>;
export type RingsRowSchema = z.infer<typeof ringsRowSchema>;
export type RingsInsertSchema = z.infer<typeof ringsInsertSchema>;
export type RingsUpdateSchema = z.infer<typeof ringsUpdateSchema>;
export type Sdh_connectionsRowSchema = z.infer<typeof sdh_connectionsRowSchema>;
export type Sdh_connectionsInsertSchema = z.infer<typeof sdh_connectionsInsertSchema>;
export type Sdh_connectionsUpdateSchema = z.infer<typeof sdh_connectionsUpdateSchema>;
export type Sdh_node_associationsRowSchema = z.infer<typeof sdh_node_associationsRowSchema>;
export type Sdh_node_associationsInsertSchema = z.infer<typeof sdh_node_associationsInsertSchema>;
export type Sdh_node_associationsUpdateSchema = z.infer<typeof sdh_node_associationsUpdateSchema>;
export type Sdh_systemsRowSchema = z.infer<typeof sdh_systemsRowSchema>;
export type Sdh_systemsInsertSchema = z.infer<typeof sdh_systemsInsertSchema>;
export type Sdh_systemsUpdateSchema = z.infer<typeof sdh_systemsUpdateSchema>;
export type Sfp_based_connectionsRowSchema = z.infer<typeof sfp_based_connectionsRowSchema>;
export type Sfp_based_connectionsInsertSchema = z.infer<typeof sfp_based_connectionsInsertSchema>;
export type Sfp_based_connectionsUpdateSchema = z.infer<typeof sfp_based_connectionsUpdateSchema>;
export type System_connectionsRowSchema = z.infer<typeof system_connectionsRowSchema>;
export type System_connectionsInsertSchema = z.infer<typeof system_connectionsInsertSchema>;
export type System_connectionsUpdateSchema = z.infer<typeof system_connectionsUpdateSchema>;
export type SystemsRowSchema = z.infer<typeof systemsRowSchema>;
export type SystemsInsertSchema = z.infer<typeof systemsInsertSchema>;
export type SystemsUpdateSchema = z.infer<typeof systemsUpdateSchema>;
export type User_profilesRowSchema = z.infer<typeof user_profilesRowSchema>;
export type User_profilesInsertSchema = z.infer<typeof user_profilesInsertSchema>;
export type User_profilesUpdateSchema = z.infer<typeof user_profilesUpdateSchema>;
export type Vmux_connectionsRowSchema = z.infer<typeof vmux_connectionsRowSchema>;
export type Vmux_connectionsInsertSchema = z.infer<typeof vmux_connectionsInsertSchema>;
export type Vmux_connectionsUpdateSchema = z.infer<typeof vmux_connectionsUpdateSchema>;
export type Vmux_systemsRowSchema = z.infer<typeof vmux_systemsRowSchema>;
export type Vmux_systemsInsertSchema = z.infer<typeof vmux_systemsInsertSchema>;
export type Vmux_systemsUpdateSchema = z.infer<typeof vmux_systemsUpdateSchema>;
export type V_cable_segments_at_jcRowSchema = z.infer<typeof v_cable_segments_at_jcRowSchema>;
export type V_cable_utilizationRowSchema = z.infer<typeof v_cable_utilizationRowSchema>;
export type V_employee_designationsRowSchema = z.infer<typeof v_employee_designationsRowSchema>;
export type V_employeesRowSchema = z.infer<typeof v_employeesRowSchema>;
export type V_end_to_end_pathsRowSchema = z.infer<typeof v_end_to_end_pathsRowSchema>;
export type V_junction_closures_completeRowSchema = z.infer<typeof v_junction_closures_completeRowSchema>;
export type V_lookup_typesRowSchema = z.infer<typeof v_lookup_typesRowSchema>;
export type V_maintenance_areasRowSchema = z.infer<typeof v_maintenance_areasRowSchema>;
export type V_nodes_completeRowSchema = z.infer<typeof v_nodes_completeRowSchema>;
export type V_ofc_cables_completeRowSchema = z.infer<typeof v_ofc_cables_completeRowSchema>;
export type V_ofc_connections_completeRowSchema = z.infer<typeof v_ofc_connections_completeRowSchema>;
export type V_ring_nodesRowSchema = z.infer<typeof v_ring_nodesRowSchema>;
export type V_ringsRowSchema = z.infer<typeof v_ringsRowSchema>;
export type V_system_connections_completeRowSchema = z.infer<typeof v_system_connections_completeRowSchema>;
export type V_system_ring_paths_detailedRowSchema = z.infer<typeof v_system_ring_paths_detailedRowSchema>;
export type V_systems_completeRowSchema = z.infer<typeof v_systems_completeRowSchema>;
export type V_user_profiles_extendedRowSchema = z.infer<typeof v_user_profiles_extendedRowSchema>;
