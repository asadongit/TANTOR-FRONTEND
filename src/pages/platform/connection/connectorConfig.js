import postgres from "../../../assets/connector/postgresql-connector.png";
import oracle from "../../../assets/connector/oracle-connector.png";
import hive from "../../../assets/connector/hive-connector.png";
import mongodb from "../../../assets/connector/mongodb-connector.png";
import mysql from "../../../assets/connector/mysql-connector.png";
import snowflake from "../../../assets/connector/snowflake-connector.png";
import mssql from "../../../assets/connector/mssql-connector.png";
import db2 from "../../../assets/connector/db2-connector.png";
import kafka from "../../../assets/connector/kafka-connector.png";

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
        { name: "url", label: "Bootstrap Servers", required: true },
        { name: "pool_type", label: "Group ID", required: true },
        { name: "security_protocol", label: "Security Protocol" },
        { name: "sasl_mechanism", label: "SASL Mechanism" },
        { name: "username", label: "SASL Username" },
        { name: "password", label: "SASL Password", type: "password" },
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
      ],
      icon: db2
    },
  };