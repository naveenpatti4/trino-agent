import { Trino } from "trino-client";

let trinoClient: Trino | null = null;

export async function getTrinoClient() {
  if (trinoClient) return trinoClient;
  
  const trinoHost = process.env.TRINO_HOST || "localhost";
  const trinoPort = process.env.TRINO_PORT || "8080";
  const trinoScheme = process.env.TRINO_SCHEME || "http";
  
  const trinoUrl = `${trinoScheme}://${trinoHost}:${trinoPort}`;
  
  trinoClient = Trino.create({
    server: trinoUrl,
    catalog: "tpch",
    schema: "tiny",
    source: "trino-web-client"
  });
  
  // Test the connection by running a simple query
  const testQuery = "SELECT 1 as test";
  const results = await trinoClient.query(testQuery);
  
  // Consume the iterator to test connectivity
  for await (const result of results) {
    if (result.error) {
      throw new Error(`Trino connection test failed: ${result.error.message}`);
    }
    // If we get here, connection is working
    break;
  }
  
  console.log("Successfully connected to Trino at", trinoUrl);
  return trinoClient;
}

export async function executeTrinoQuery(query: string) {
  const client = await getTrinoClient();
  
  const results = await client.query(query);
  const allResults = [];
  
  for await (const result of results) {
    if (result.error) {
      throw new Error(`Query failed: ${result.error.message}`);
    }
    allResults.push(result);
  }
  
  // Combine all results
  const columns = allResults[0]?.columns || [];
  const data = allResults.flatMap(result => result.data || []);
  
  return {
    columns: columns.map(col => col.name),
    data,
    row_count: data.length
  };
}

export type TrinoTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const trinoTools: TrinoTool[] = [
  {
    name: "list_catalogs",
    description: "List all available catalogs in Trino",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "list_schemas",
    description: "List schemas in a given catalog",
    inputSchema: {
      type: "object",
      properties: {
        catalog: {
          type: "string",
          description: "The catalog name"
        }
      },
      required: ["catalog"]
    }
  },
  {
    name: "list_tables",
    description: "List tables in a given schema",
    inputSchema: {
      type: "object",
      properties: {
        catalog: {
          type: "string",
          description: "The catalog name"
        },
        schema: {
          type: "string",
          description: "The schema name"
        }
      },
      required: ["catalog", "schema"]
    }
  },
  {
    name: "get_table_schema",
    description: "Get the schema/structure of a specific table",
    inputSchema: {
      type: "object",
      properties: {
        catalog: {
          type: "string",
          description: "The catalog name"
        },
        schema: {
          type: "string",
          description: "The schema name"
        },
        table: {
          type: "string",
          description: "The table name"
        }
      },
      required: ["catalog", "schema", "table"]
    }
  },
  {
    name: "execute_query",
    description: "Execute a SQL query against Trino",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The SQL query to execute"
        }
      },
      required: ["query"]
    }
  }
];

export async function callTrinoTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_catalogs": {
      const result = await executeTrinoQuery("SHOW CATALOGS");
      return {
        catalogs: result.data.map((row: string[]) => row[0])
      };
    }
    
    case "list_schemas": {
      const catalog = args.catalog as string;
      const result = await executeTrinoQuery(`SHOW SCHEMAS FROM "${catalog}"`);
      return {
        schemas: result.data.map((row: string[]) => row[0])
      };
    }
    
    case "list_tables": {
      const schemaCatalog = args.catalog as string;
      const schema = args.schema as string;
      const result = await executeTrinoQuery(`SHOW TABLES FROM "${schemaCatalog}"."${schema}"`);
      return {
        tables: result.data.map((row: string[]) => row[0])
      };
    }
    
    case "get_table_schema": {
      const tableCatalog = args.catalog as string;
      const tableSchema = args.schema as string;
      const table = args.table as string;
      const result = await executeTrinoQuery(`DESCRIBE "${tableCatalog}"."${tableSchema}"."${table}"`);
      return {
        columns: result.data.map((row: string[]) => ({
          name: row[0],
          type: row[1],
          nullable: row[2] !== "NO"
        }))
      };
    }
    
    case "execute_query": {
      const query = args.query as string;
      return executeTrinoQuery(query);
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function getConnectionStatus() {
  try {
    await getTrinoClient();
    return {
      mode: "direct_trino",
      status: "connected",
      message: "Connected directly to Trino database",
      endpoint: `${process.env.TRINO_SCHEME || "http"}://${process.env.TRINO_HOST || "localhost"}:${process.env.TRINO_PORT || "8080"}`,
      features: ["list_catalogs", "list_schemas", "list_tables", "get_table_schema", "execute_query"]
    };
  } catch (error) {
    return {
      mode: "error",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown connection error",
      endpoint: null,
      features: []
    };
  }
}