import Metadata from "../pages/datagovernance/DataAssurance/Quality/Metadata/Metadata";

const columnConfigurations = {
    common: [],
  
    cdc: [
      { key: "cdc_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { label: "Action", sortable: false },
    ],
  
    connections: [
      { key: "connection_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "pool_type", label: "Connection Type", sortable: true },
      { key: "database_name", label: "Database Name", sortable: true },
      { key: "username", label: "Username", sortable: true },
      { key: "host_address", label: "Hostname", sortable: true },
      { key: "table_count", label: "No. of Tables", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { label: "Action", sortable: false },
    ],
  
    transformation: [
      { key: "workflow_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { label: "Action", sortable: false },
    ],
  
    migration: [
      { key: "workflow_name", label: "Name", sortable: true },
      { key: "project", label: "Project", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { label: "Action", sortable: false },
    ],

    metadata: [
      { key: "metadata_name", label: "Name", sortable: true },
      { key: "project", label: "Project", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { label: "Action", sortable: false },
    ],
  
    purge: [
      { key: "purge_name", label: "Name", sortable: true },
      { key: "project", label: "Project Name", sortable: true },
      { key: "created_by", label: "Created By", sortable: true },
      { key: "source_conn_name", label: "Source Connection", sortable: true },
      { key: "target_conn_name", label: "Target Connection", sortable: true },
      { key: "source_table", label: "Source Table", sortable: true },
      { key: "target_table", label: "Target Table", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { label: "Action", sortable: false },
    ],
  
    project: [
      { key: "project_name", label: "Project Name", sortable: true },
      { key: "records_purged", label: "Records Purged", sortable: true },
      { key: "timestamp", label: "Purge Timestamp", sortable: true },
      { key: "size_before", label: "Size Before", sortable: true },
      { key: "size_after", label: "Size After", sortable: true },
      { label: "Action", sortable: false },
    ],
  
    federation: [
      { key: "connection_name", label: "Name", sortable: true },
      { key: "project", label: "Project", sortable: true },
      { key: "schema", label: "Schema", sortable: true },
      { key: "timestamp", label: "Table", sortable: true },
      { key: "Views", label: "Views", sortable: true },
      { label: "Action", sortable: false },
    ],
    viewconnections: [
      { key: "table_name", label: "Table Name", sortable: true },
      { key: "project", label: "View Columns", sortable: true },
      { key: "is_migrated", label: "Migration", sortable: true },
      { key: "is_purged", label: "Purge", sortable: true },
      { key: "is_virtualization", label: "Data Federation", sortable: true },
      { key: "cdc_enabled", label: "CDC", sortable: true },
    ],
    rules: [
      // { key: "s_no", label: "#", sortable: true },
      { key: "id", label: "ID", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "description", label: "Description", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "created", label: "Created", sortable: true },
      { key: "updated", label: "Updated", sortable: true },
      { label: "Action", sortable: false },
],
  };
  
  export default columnConfigurations;
  