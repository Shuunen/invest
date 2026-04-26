import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PortfolioSchema } from "../schemas/index.ts";
import { useAppStore } from "../store/use-app-store.ts";
import { FormControl } from "./form-control.tsx";
import { ModalActions } from "./modal-actions.tsx";
import { ModalHeader } from "./modal-header.tsx";

function useCreatePortfolioForm(onClose: () => void) {
  const addPortfolio = useAppStore(state => state.addPortfolio);
  const navigate = useNavigate();
  const [broker, setBroker] = useState("");
  const [brokerError, setBrokerError] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    const nameTrimmed = name.trim();
    if (!nameTrimmed) {
      setNameError("Name is required.");
      return;
    }
    const brokerTrimmed = broker.trim();
    if (!brokerTrimmed) {
      setBrokerError("Broker is required.");
      return;
    }
    const portfolio = PortfolioSchema.parse({
      broker: brokerTrimmed,
      entries: [],
      id: crypto.randomUUID(),
      name: nameTrimmed,
    });
    addPortfolio(portfolio);
    onClose();
    void navigate({ params: { id: portfolio.id }, to: "/portfolios/$id" });
  }

  return { broker, brokerError, handleSubmit, name, nameError, setBroker, setBrokerError, setName, setNameError };
}

export function CreatePortfolioModal({ onClose }: { onClose: () => void }) {
  const { broker, brokerError, handleSubmit, name, nameError, setBroker, setName } = useCreatePortfolioForm(onClose);
  return (
    <dialog className="modal-open modal" aria-modal="true">
      <div className="modal-box">
        <ModalHeader title="Create portfolio" onClose={onClose} />
        <form onSubmit={handleSubmit} noValidate>
          <FormControl label="Name" name="portfolio-name" placeholder="ex : Personal portfolio" error={nameError} setValue={setName} value={name} />
          <FormControl label="Broker" name="portfolio-broker" placeholder="ex : Interactive Brokers" error={brokerError} setValue={setBroker} value={broker} />
          <ModalActions onCancel={onClose} confirmText="Create" />
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
