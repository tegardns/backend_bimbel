import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

export const settingsRouter = Router();

// Default configuration for Linktree
const DEFAULT_LINKTREE = {
  logoUrl: "https://tssqzthevljcoxxyixbo.supabase.co/storage/v1/object/public/article-images/bim.png", // Fallback to a default logo if none is set
  title: "Bimbel Saka",
  tagline: "Ada Saka, Pasti Bisa!",
  instagramUrl: "https://instagram.com/bimbelsaka",
  whatsappUrl: "https://wa.me/62895357409769",
  banner: {
    imageUrl: "",
    linkUrl: "",
    isActive: false
  },
  links: [
    {
      id: "1",
      title: "HARGA AFFORDABLE ❤️",
      url: "/harga",
      icon: "HeartHandshake",
      isActive: true
    },
    {
      id: "2",
      title: "Gratis Registrasi",
      url: "/daftar",
      icon: "UserPlus",
      isActive: true
    },
    {
      id: "3",
      title: "DAFTAR LES",
      url: "/daftar",
      icon: "FileSpreadsheet",
      isActive: true
    },
    {
      id: "4",
      title: "KARIR",
      url: "/karir",
      icon: "Briefcase",
      isActive: true
    },
    {
      id: "5",
      title: "AI SAKA",
      url: "/tanya-pr",
      icon: "Sparkles",
      isActive: true
    },
    {
      id: "6",
      title: "TES LOGIKA",
      url: "/tes-logika",
      icon: "Brain",
      isActive: true
    },
    {
      id: "7",
      title: "OFFICIAL WEBSITE",
      url: "/",
      icon: "Globe",
      isActive: true
    }
  ]
};

/**
 * GET settings by key
 */
settingsRouter.get("/:key", async (req: Request, res: Response): Promise<any> => {
  try {
    const { key } = req.params;

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      // Table doesn't exist error code is '42P01' in PostgreSQL
      if (error.code === "42P01") {
        console.warn(`[Settings] Table 'settings' does not exist. Returning default mock for key: ${key}`);
        return res.json({
          success: true,
          isMock: true,
          data: key === "linktree_config" ? DEFAULT_LINKTREE : {}
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    if (!data) {
      // Return default if not found
      return res.json({
        success: true,
        data: key === "linktree_config" ? DEFAULT_LINKTREE : {}
      });
    }

    return res.json({
      success: true,
      data: data.value
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/**
 * POST / UPSERT settings by key
 */
settingsRouter.post("/:key", async (req: Request, res: Response): Promise<any> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: "Value is required"
      });
    }

    // Try to upsert into settings table
    const { data, error } = await supabase
      .from("settings")
      .upsert({
        key,
        value,
        updated_at: new Date()
      }, {
        onConflict: "key"
      })
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return res.status(400).json({
          success: false,
          code: "TABLE_NOT_FOUND",
          message: "Tabel 'settings' belum dibuat di Supabase. Silakan buat tabel 'settings' terlebih dahulu di SQL Editor Supabase Anda.",
          sql: `CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    return res.json({
      success: true,
      data: data.value
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
