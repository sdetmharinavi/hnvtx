```sh
mkdir -p migrations/{00_setup,01_user_management,02_core_infrastructure,03_network_systems,04_advanced_ofc,05_auditing,06_utilities,99_finalization} && \
touch migrations/00_setup/01_roles.sql \
migrations/01_user_management/{01_tables_user_profiles.sql,02_views.sql,03_functions.sql,04_indexes.sql,05_triggers.sql,06_rls_and_grants.sql} \
migrations/02_core_infrastructure/{01_tables_core.sql,02_functions.sql,03_views.sql,04_indexes.sql,05_triggers.sql,06_rls_and_grants.sql} \
migrations/03_network_systems/{01_tables_systems.sql,02_views.sql,03_indexes.sql,04_triggers.sql,05_rls_and_grants.sql} \
migrations/04_advanced_ofc/{01_tables_advanced_ofc.sql,02_views.sql,03_indexes.sql,04_triggers.sql,05_rls_and_grants.sql} \
migrations/05_auditing/{01_table_user_activity_logs.sql,02_functions.sql,03_triggers_attach_all.sql,04_rls_and_grants.sql} \
migrations/06_utilities/{01_generic_functions.sql,02_dashboard_functions.sql} \
migrations/99_finalization/{01_cross_module_constraints.sql,02_cross_module_grants.sql}

```