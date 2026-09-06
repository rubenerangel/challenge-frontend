import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormularioNota } from "@/components/formulario-nota";

describe("FormularioNota", () => {
  it("avisa que la nota quedó guardada", async () => {
    const usuario = userEvent.setup();
    render(<FormularioNota />);

    await usuario.type(screen.getByLabelText("Tu nota"), "Comprar café");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Guardado")).toBeInTheDocument();
  });

  it("muestra un modal de error y no marca como guardado si el servidor rechaza la nota", async () => {
    const usuario = userEvent.setup();
    render(<FormularioNota />);

    await usuario.type(screen.getByLabelText("Tu nota"), "Esto falla siempre");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("La nota NO ha sido guardada, vuelve a intentar")
    ).toBeInTheDocument();
    expect(screen.queryByText("Guardado")).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(
      screen.queryByText("La nota NO ha sido guardada, vuelve a intentar")
    ).not.toBeInTheDocument();
  });
});
