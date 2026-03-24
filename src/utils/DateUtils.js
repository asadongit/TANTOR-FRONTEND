/**
 * Shared date formatting utility to maintain consistency across the application.
 * Matches the format: MMM DD, YYYY, HH:mm:ss A (e.g., Mar 17, 2026, 04:13:09 PM)
 */
export const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);

    // Return original string if it's not a valid date
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
};
