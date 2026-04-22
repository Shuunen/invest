import { useAppStore, defaultAppData } from "./use-app-store.ts";

describe("useAppStore - initial state and load", () => {
  it("starts with isLoading true and empty data", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const state = useAppStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.data.assets).toHaveLength(0);
    expect(state.loadError).toBeUndefined();
  });

  it("loadData sets data and clears loading/error", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const mockData = { ...defaultAppData };
    useAppStore.getState().loadData(mockData);
    const state = useAppStore.getState();
    expect(state.data).toBe(mockData);
    expect(state.isLoading).toBe(false);
    expect(state.loadError).toBeUndefined();
  });

  it("setLoadError sets loadError and clears isLoading", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: true, loadError: undefined });
    const err = new Error("test error");
    useAppStore.getState().setLoadError(err);
    const state = useAppStore.getState();
    expect(state.loadError).toBe(err);
    expect(state.isLoading).toBe(false);
  });
});

describe("useAppStore - settings mutations", () => {
  it("setSort updates settings.sort", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setSort({ column: "fees", direction: "asc" });
    expect(useAppStore.getState().data.settings.sort).toStrictEqual({ column: "fees", direction: "asc" });
  });

  it("setColumnVisibility updates settings.columnVisibility", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setColumnVisibility({ name: false });
    expect(useAppStore.getState().data.settings.columnVisibility).toStrictEqual({ name: false });
  });

  it("setColumnOrder updates settings.columnOrder", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    useAppStore.getState().setColumnOrder(["score", "name", "fees"]);
    expect(useAppStore.getState().data.settings.columnOrder).toStrictEqual(["score", "name", "fees"]);
  });

  it("subscribeWithSelector fires subscriber on mutation", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const received: unknown[] = [];
    const unsub = useAppStore.subscribe(
      state => state.data,
      receivedData => received.push(receivedData),
    );
    useAppStore.getState().setSort({ column: "fees", direction: "asc" });
    unsub();
    expect(received.length).toBeGreaterThan(0);
  });
});
