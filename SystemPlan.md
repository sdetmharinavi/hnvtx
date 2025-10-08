# System Plan

- Rings are already created.
- Nodes are added to the rings through dashboard/systems Add new button. Already done.
- Add system_id in ofc_connections table referencing system table.
- Ring connections are to be created. Suppose Ring named HNV-01 is having nodes N1, N2, N3, then connection paths will be added as HNV-01:N1-N2, HNV-01:N2-N3, HNV-01:N3-N1
- Now on System ring paths page, on selecting ring from dropdown, we get all the connection paths of that ring.
- On clicking a connection path a modal will open having searchable select for the cables. Suppose we clicked HNV-01:N1-N2, then all the cables with N1 node included will be shown. User will select correct cable say cable N1-X-01,upon selecting cable, option to select fibers will come, user can select two fibers(on trans and one receive). system_id in ofc_connections table for selected fibers will get filled.
- If selected cable does not include N2, then for HNV-01:N1-N2, cascade button will appear, on clicking that, we will get all the cables with X node included and we will select correct cable say cable X-N2-01,upon selecting cable, option to select fibers will come, user can select two fibers(on trans and one receive). system_id in ofc_connections table for selected fibers will get filled.
- Means cascading will happen till cable with N2 will be selected.
- Same for other paths.
