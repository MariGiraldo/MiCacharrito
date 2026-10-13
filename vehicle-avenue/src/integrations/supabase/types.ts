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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      carrito_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          user_id: string
          vehiculo_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          user_id: string
          vehiculo_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          user_id?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrito_items_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      detalle_pedido: {
        Row: {
          cantidad: number
          id: string
          pedido_id: string
          precio_unitario: number
          vehiculo_id: string
        }
        Insert: {
          cantidad: number
          id?: string
          pedido_id: string
          precio_unitario: number
          vehiculo_id: string
        }
        Update: {
          cantidad?: number
          id?: string
          pedido_id?: string
          precio_unitario?: number
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_pedido_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          id: string
          stock: number
          ubicacion: string | null
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          id?: string
          stock?: number
          ubicacion?: string | null
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          id?: string
          stock?: number
          ubicacion?: string | null
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: true
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas: {
        Row: {
          categoria_id: number
          id: number
          nombre: string
          pais_origen: string | null
        }
        Insert: {
          categoria_id: number
          id?: number
          nombre: string
          pais_origen?: string | null
        }
        Update: {
          categoria_id?: number
          id?: number
          nombre?: string
          pais_origen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marcas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          created_at: string
          estado: string
          id: string
          metodo: string
          monto: number
          pedido_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          metodo: string
          monto: number
          pedido_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          metodo?: string
          monto?: number
          pedido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string
          estado: string
          id: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ciudad: string | null
          created_at: string
          direccion: string | null
          documento: string | null
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          documento?: string | null
          id: string
          nombre?: string
          telefono?: string | null
        }
        Update: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          documento?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      vehiculos: {
        Row: {
          activo: boolean
          anio: number
          categoria_id: number
          color: string | null
          combustible: string | null
          condicion: string
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          kilometraje: number
          marca_id: number
          modelo: string
          precio: number
          transmision: string | null
          vendedor_id: string
        }
        Insert: {
          activo?: boolean
          anio: number
          categoria_id: number
          color?: string | null
          combustible?: string | null
          condicion?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          kilometraje?: number
          marca_id: number
          modelo: string
          precio: number
          transmision?: string | null
          vendedor_id: string
        }
        Update: {
          activo?: boolean
          anio?: number
          categoria_id?: number
          color?: string | null
          combustible?: string | null
          condicion?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          kilometraje?: number
          marca_id?: number
          modelo?: string
          precio?: number
          transmision?: string | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedores: {
        Row: {
          calificacion: number
          ciudad: string | null
          created_at: string
          email: string | null
          id: string
          nit: string | null
          nombre_comercial: string
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          calificacion?: number
          ciudad?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nit?: string | null
          nombre_comercial: string
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          calificacion?: number
          ciudad?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nit?: string | null
          nombre_comercial?: string
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      realizar_pedido: { Args: { p_metodo: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
