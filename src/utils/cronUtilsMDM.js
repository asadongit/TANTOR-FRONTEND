const DAY_TO_CRON = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const parseTime = (t) => {
  const [hour, minute] = t.split(':').map(Number);
  return { hour, minute };
};

export const buildCronExpressions = ({ frequency, time, timeTwo, day }) => {
  if (frequency === 'Daily') {
    const { hour, minute } = parseTime(time);
    return [`${minute} ${hour} * * *`];
  }

  if (frequency === 'Twice Daily') {
    const first = parseTime(time);
    const second = parseTime(timeTwo);
    return [
      `${first.minute} ${first.hour} * * *`,
      `${second.minute} ${second.hour} * * *`,
    ];
  }

  if (frequency === 'Weekly') {
    const { hour, minute } = parseTime(time);
    const dow = DAY_TO_CRON[day];
    return [`${minute} ${hour} * * ${dow}`];
  }

  return [];
};

export const buildCronExpressionString = (schedule) =>
  buildCronExpressions(schedule).join(';');