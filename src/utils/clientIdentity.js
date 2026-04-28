const PLAYER_KEY = 'pp_player';

export const loadPlayer = () => {
  try {
    return JSON.parse(sessionStorage.getItem(PLAYER_KEY));
  } catch {
    return null;
  }
};

export const savePlayer = (player) => {
  if (player) {
    sessionStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  } else {
    sessionStorage.removeItem(PLAYER_KEY);
  }
};

export const clearPlayer = () => savePlayer(null);
