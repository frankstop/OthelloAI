(function (root, factory) {
    const api = factory();
    root.OthelloStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    const keys = {
        saves: "othello_ai_saves_v1",
        stats: "othello_ai_stats_v1",
        settings: "othello_ai_settings_v1",
        leaderboard: "othello_ai_leaderboard_v1",
    };

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getSaves() {
        return read(keys.saves, []);
    }

    function setSaves(saves) {
        write(keys.saves, saves);
    }

    function getStats() {
        return read(keys.stats, { wins: 0, losses: 0, draws: 0, total_points: 0 });
    }

    function setStats(stats) {
        write(keys.stats, stats);
        write(keys.leaderboard, [{ username: "Player", ...stats }]);
    }

    function getSettings() {
        return read(keys.settings, { playerColor: -1, aiLevel: "easy" });
    }

    function setSettings(settings) {
        write(keys.settings, settings);
    }

    function getLeaderboard() {
        const stats = getStats();
        return read(keys.leaderboard, [{ username: "Player", ...stats }]);
    }

    return {
        keys,
        getSaves,
        setSaves,
        getStats,
        setStats,
        getSettings,
        setSettings,
        getLeaderboard,
    };
});
