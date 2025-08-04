export const formatPercentage = (value: number): string => {
	if (value === 0) return '0%';
	if (value === 1) return '100%';
	const percentage = value * 100;
	if (percentage < 0.1) return '<0.1%';
	if (percentage > 99.9) return '>99.9%';
	return `${percentage.toFixed(1)}%`;
};
