import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { PortfolioSchema } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";

function useCreatePortfolioForm(onClose: () => void) {
  const addPortfolio = useAppStore(state => state.addPortfolio);
  const navigate = useNavigate();
  const [broker, setBroker] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required.");
      return;
    }
    const portfolio = PortfolioSchema.parse({
      broker: broker.trim(),
      entries: [],
      id: crypto.randomUUID(),
      name: trimmedName,
    });
    addPortfolio(portfolio);
    onClose();
    void navigate({ params: { id: portfolio.id }, to: "/portfolios/$id" });
  }

  return { broker, handleSubmit, name, nameError, setBroker, setName, setNameError };
}

type RenderFormArgs = {
  broker: string;
  name: string;
  nameError: string | undefined;
  onBrokerChange: (value: string) => void;
  onClose: () => void;
  onNameInput: (value: string) => void;
  onSubmit: (event: React.SyntheticEvent) => void;
};

function renderForm({ broker, name, nameError, onBrokerChange, onClose, onNameInput, onSubmit }: RenderFormArgs) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="form-control mb-4">
        <label className="label" htmlFor="portfolio-name">
          <span className="label-text">Name</span>
        </label>
        <input
          id="portfolio-name"
          type="text"
          className={`input-bordered input w-full${nameError ? " input-error" : ""}`}
          placeholder="e.g. Growth Portfolio"
          value={name}
          onChange={event => onNameInput(event.target.value)}
          autoFocus
        />
        {nameError !== undefined && <p className="mt-1 text-sm text-error">{nameError}</p>}
      </div>
      <div className="form-control mb-6">
        <label className="label" htmlFor="portfolio-broker">
          <span className="label-text">Broker (optional)</span>
        </label>
        <input
          id="portfolio-broker"
          type="text"
          className="input-bordered input w-full"
          placeholder="e.g. Interactive Brokers"
          value={broker}
          onChange={event => onBrokerChange(event.target.value)}
        />
      </div>
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Create
        </button>
      </div>
    </form>
  );
}

type Props = {
  onClose: () => void;
};

export function CreatePortfolioModal({ onClose }: Props) {
  const { broker, handleSubmit, name, nameError, setBroker, setName, setNameError } = useCreatePortfolioForm(onClose);
  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">New Portfolio</h3>
          <button type="button" className="btn btn-circle btn-ghost btn-sm" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {renderForm({
          broker,
          name,
          nameError,
          onBrokerChange: setBroker,
          onClose,
          onNameInput: value => {
            setName(value);
            setNameError(undefined);
          },
          onSubmit: handleSubmit,
        })}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
