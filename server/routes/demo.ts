import { RequestHandler } from "express";
import { SearchResponse } from "../../shared/api";

// Endpoint mínimo de prueba para validar que el backend responde.
export const handleDemo: RequestHandler = (req, res) => {
  const response = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};
