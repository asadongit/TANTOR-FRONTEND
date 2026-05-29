import postgres from "../../../../assets/connector/postgresql-connector.png";
import oracle from "../../../../assets/connector/oracle-connector.png";
import hive from "../../../../assets/connector/hive-connector.png";
import mongodb from "../../../../assets/connector/mongodb-connector.png";
import mysql from "../../../../assets/connector/mysql-connector.png";
import snowflake from "../../../../assets/connector/snowflake-connector.png";
import mssql from "../../../../assets/connector/mssql-connector.png";
import db2 from "../../../../assets/connector/db2-connector.png";
import kafka from "../../../../assets/connector/kafka-connector.png";
import iris from "../../../../assets/connector/iris-connector.png";

export const connectorConfig = {
    oracle: {
      fields: [
        {
          name: "host_address",
          label: "Host",
          required: true,
          placeholder: "Enter host address",
        },
        {
          name: "port_number",
          label: "Port",
          type: "number",
          required: true,
          placeholder: "Enter port number",
        },
        { name: "username", label: "Username", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
        { name: "database_name", label: "Database Name", required: true },
        { name: "source_schema", label: "Schema", required: false },
      ],
      icon: oracle
    },
    postgres: {
      fields: [
        {
          name: "host_address",
          label: "Host",
          required: true,
          placeholder: "Enter host address",
        },
        {
          name: "port_number",
          label: "Port",
          type: "number",
          required: true,
          placeholder: "Enter port number",
        },
        { name: "username", label: "Username", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
        { name: "database_name", label: "Database Name", required: true },
        { name: "source_schema", label: "Schema", required: false },
      ],
      icon: postgres
    },
    mysql: {
      fields: [
        {
          name: "host_address",
          label: "Host",
          required: true,
          placeholder: "Enter host address",
        },
        {
          name: "port_number",
          label: "Port",
          type: "number",
          required: true,
          placeholder: "Enter port number",
        },
        { name: "username", label: "Username", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
        { name: "database_name", label: "Database Name", required: true },
        { name: "source_schema", label: "Schema", required: false },
      ],
      icon: mysql
    },
    mssql: {
      fields: [
        {
          name: "host_address",
          label: "Host",
          required: true,
          placeholder: "Enter host address",
        },
        {
          name: "port_number",
          label: "Port",
          type: "number",
          required: true,
          placeholder: "Enter port number",
        },
        { name: "username", label: "Username", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
        },
        { name: "database_name", label: "Database Name", required: true },
        { name: "source_schema", label: "Schema", required: false },
      ],
      icon: mssql
    },
    hive: {
      fields: [
        { name: "host_address", label: "Host", required: true },
        { name: "port_number", label: "Port", type: "number", required: true },
        { name: "client_principal", label: "Client", required: true },
        {
          name: "service_principal",
          label: "Service Principal",
          required: true,
        },
        { name: "username", label: "Username" },
        { name: "password", label: "Password", type: "password" },
        { name: "source_schema", label: "Schema", required: false },
      ],
      icon: hive
    },
    snowflake: {
      fields: [
        { name: "host_address", label: "Account", required: true },
        { name: "username", label: "Username", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "extra_info.warehouse", label: "Warehouse", required: true },
        { name: "database_name", label: "Database", required: true },
        { name: "source_schema", label: "Schema", required: true },
      ],
      icon: snowflake
    },
  kafka: {
  fields: [
    { name: "host_address", label: "Host", required: true },
    { name: "port_number", label: "Port", type: "number", required: true },
    {
      name: "extra_info.security_protocol",
      label: "Security Protocol",
      type: "select",
      options: ["PLAINTEXT", "SSL", "SASL_PLAINTEXT", "SASL_SSL"],
      required: true,
    },
    {
      name: "extra_info.truststore_location",
      label: "Truststore File",
      type: "file",
      required: true,
      conditionalOn: {
        field: "extra_info.security_protocol",
        values: ["SSL", "SASL_SSL"],
      },
    },
    {
      name: "extra_info.truststore_password",
      label: "Truststore Password",
      type: "password",
      required: true,
      conditionalOn: {
        field: "extra_info.security_protocol",
        values: ["SSL", "SASL_SSL"],
      },
    },
    {
      name: "extra_info.truststore_type",
      label: "Truststore Type",
      type: "select",
      options: ["PKCS12"],
      required: true,
      conditionalOn: {
        field: "extra_info.security_protocol",
        values: ["SSL", "SASL_SSL"],
      },
    },
    {
      name: "extra_info.sasl_mechanism",
      label: "SASL Mechanism",
      type: "select",
      options: ["PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512"],
      required: true,
      conditionalOn: {
        field: "extra_info.security_protocol",
        values: ["SASL_PLAINTEXT", "SASL_SSL"],
      },
    },
    {
      name: "username",
      label: "SASL Username",
      required: true,
      conditionalOn: {
        field: "extra_info.security_protocol",
        values: ["SASL_PLAINTEXT", "SASL_SSL"],
      },
    },
    {
      name: "password",
      label: "SASL Password",
      type: "password",
      required: true,
      conditionalOn: {
        field: "extra_info.security_protocol",
        values: ["SASL_PLAINTEXT", "SASL_SSL"],
      },
    },
     {
      name: "extra_info.type",
      label: "Type",
      type: "select",
      options: ["avro", "raw", "custom"],
      required: true,
    },
    {
      name: "extra_info.schema_registery_url",
      label: "Schema Registry URL",
      required: true,
      conditionalOn: { field: "extra_info.type", value: "avro" },
    },
  ],
  icon: kafka
},
    mongodb: {
      fields: [
        { name: "url", label: "Connection String", required: true },
        { name: "database_name", label: "Database", required: true },
        { name: "username", label: "Username" },
        { name: "password", label: "Password", type: "password" },
      ],
      icon: mongodb
    },
    db2: {
      fields: [
        { name: "host_address", label: "Host", required: true },
        { name: "port_number", label: "Port", type: "number", required: true },
        { name: "database_name", label: "Database", required: true },
        { name: "username", label: "Username", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "source_schema", label: "Schema", required: false },
      ],
      icon: db2
    },
    iris: {
      fields: [
        { name: "host_address", label: "Host", required: true },
        { name: "port_number", label: "Port", type: "number", required: true },
        { name: "database_name", label: "Database", required: true },
        { name: "username", label: "Username", required: true },
        { name: "password", label: "Password", type: "password", required: true },
        { name: "source_schema", label: "Schema", required: false },
      ],
      icon: iris
    },
  };