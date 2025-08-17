// Google Analytics utility functions for tracking custom events

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Check if Google Analytics is loaded
const isGAReady = (): boolean => {
  return typeof window !== "undefined" && typeof window.gtag === "function";
};

// Track page views
export const trackPageView = (page: string) => {
  if (isGAReady()) {
    window.gtag("event", "page_view", {
      page_title: page,
      page_location: window.location.href,
    });
  }
};

// Track room creation
export const trackRoomCreated = (contentType: "movies" | "tv") => {
  if (isGAReady()) {
    window.gtag("event", "room_created", {
      content_type: contentType,
      event_category: "room",
      event_label: "room_creation",
    });
  }
};

// Track user joining room
export const trackUserJoinedRoom = (
  roomCode: string,
  contentType: "movies" | "tv"
) => {
  if (isGAReady()) {
    window.gtag("event", "user_joined_room", {
      room_code: roomCode,
      content_type: contentType,
      event_category: "room",
      event_label: "user_join",
    });
  }
};

// Track match found
export const trackMatchFound = (
  showId: string,
  matchedUsers: string[],
  contentType: "movies" | "tv"
) => {
  if (isGAReady()) {
    window.gtag("event", "match_found", {
      show_id: showId,
      matched_users_count: matchedUsers.length,
      content_type: contentType,
      event_category: "match",
      event_label: "match_found",
    });
  }
};

// Track swipe action
export const trackSwipe = (
  direction: "left" | "right",
  contentType: "movies" | "tv"
) => {
  if (isGAReady()) {
    window.gtag("event", "swipe_made", {
      direction: direction,
      content_type: contentType,
      event_category: "swipe",
      event_label: "user_swipe",
    });
  }
};

// Track user leaving room
export const trackUserLeftRoom = (
  roomCode: string,
  contentType: "movies" | "tv"
) => {
  if (isGAReady()) {
    window.gtag("event", "user_left_room", {
      room_code: roomCode,
      content_type: contentType,
      event_category: "room",
      event_label: "user_leave",
    });
  }
};

// Track error events
export const trackError = (errorType: string, errorMessage: string) => {
  if (isGAReady()) {
    window.gtag("event", "error_occurred", {
      error_type: errorType,
      error_message: errorMessage,
      event_category: "error",
      event_label: "app_error",
    });
  }
};

// Track custom events
export const trackCustomEvent = (
  eventName: string,
  parameters: Record<string, any> = {}
) => {
  if (isGAReady()) {
    window.gtag("event", eventName, parameters);
  }
};
