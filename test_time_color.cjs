const getTimeColor = (timeStr) => {
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return 'text-amber-600'; // 早班
    if (hour >= 12 && hour < 18) return 'text-orange-600'; // 午班
    return 'text-indigo-600'; // 晚班
};
console.log(getTimeColor('08:00'));
console.log(getTimeColor('14:00'));
console.log(getTimeColor('22:00'));
