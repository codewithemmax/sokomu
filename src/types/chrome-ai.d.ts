export {};

declare global {
  type LanguageModelAvailability =
    | "unavailable"
    | "downloadable"
    | "downloading"
    | "available";

  interface LanguageModelDownloadProgressEvent extends Event {
    readonly loaded: number;
    readonly total?: number;
  }

  interface LanguageModelMonitor extends EventTarget {
    addEventListener(
      type: "downloadprogress",
      listener: (event: LanguageModelDownloadProgressEvent) => void,
    ): void;
    removeEventListener?(
      type: "downloadprogress",
      listener: (event: LanguageModelDownloadProgressEvent) => void,
    ): void;
  }

  interface LanguageModelSession {
    prompt(
      input: string,
      options?: { responseConstraint?: object; signal?: AbortSignal },
    ): Promise<string>;
    destroy(): void;
  }

  interface LanguageModelStatic {
    availability(options?: Record<string, unknown>): Promise<LanguageModelAvailability>;
    create(
      options?: {
        monitor?: (monitor: LanguageModelMonitor) => void;
        signal?: AbortSignal;
      } & Record<string, unknown>,
    ): Promise<LanguageModelSession>;
  }

  // Browser-injected Chrome Prompt API global (Chrome 139+ desktop).
  var LanguageModel: LanguageModelStatic | undefined;
}
