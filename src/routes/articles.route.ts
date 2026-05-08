import { Router } from "express";
import { supabase } from "../lib/supabase";

export const articlesRouter = Router();

/**
 * PUBLIC
 * Ambil artikel published
 */
articlesRouter.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * ADMIN
 * Ambil semua artikel
 */
articlesRouter.get("/admin", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * PUBLIC
 * Ambil detail artikel berdasarkan ID
 */
articlesRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Artikel tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * CREATE
 */
articlesRouter.post("/admin", async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      status,
      category,
      author,
      read_time,
      tags,
    } = req.body;

    const { data, error } = await supabase
      .from("articles")
      .insert([
        {
          title,
          slug,
          excerpt,
          content,
          cover_image,
          status,
          category,
          author,
          read_time,
          tags,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * UPDATE
 */
articlesRouter.put("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      status,
      category,
      author,
      read_time,
      tags,
    } = req.body;

    const { data, error } = await supabase
      .from("articles")
      .update({
        title,
        slug,
        excerpt,
        content,
        cover_image,
        status,
        category,
        author,
        read_time,
        tags,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * DELETE
 */
articlesRouter.delete("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("articles").delete().eq("id", id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
