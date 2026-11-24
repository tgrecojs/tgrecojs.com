// Records a named event in Umami; README.md lists the events this site sends. The Umami
// script loads only in production builds, so this does nothing in dev, and nothing for a
// reader whose browser blocks it.
type EventData = Record<string, string | number>;

export const track = (name: string, data?: EventData) => {
  (window as { umami?: { track: (name: string, data?: EventData) => void } }).umami?.track(name, data);
};
