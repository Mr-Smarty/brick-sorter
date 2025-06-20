import React from 'react';
import {Box, Text} from 'ink';

type PaginationDisplayProps = {
	current: number; // Current page number
	total: number; // Total number of pages
	highlightColor?: string; // Color to highlight the current page
};

const PaginationDisplay: React.FC<PaginationDisplayProps> = ({
	current,
	total,
	highlightColor = 'blue',
}) => {
	// Helper function to render a single page number
	const renderPage = (page: number): React.ReactNode => {
		return [
			<Text
				key={page}
				color={page === current ? highlightColor : undefined}
				bold={page === current}
				underline={page === current}
			>
				{page}
			</Text>,
			page !== total ? <Text key={`space-${page}`}> </Text> : null, // Add space after each page except the last
		];
	};

	if (total <= 5) {
		// Show all pages if there are 5 or fewer
		return (
			<Box>{Array.from({length: total}, (_, i) => i + 1).map(renderPage)}</Box>
		);
	}

	// Handle special case for the first page
	if (current === 1) {
		return (
			<Box>
				{renderPage(1)}
				{renderPage(2)}
				<Text>• </Text>
				{renderPage(total)}
			</Box>
		);
	}

	// Handle special case for the second page
	if (current === 2) {
		return (
			<Box>
				{renderPage(1)}
				{renderPage(2)}
				{renderPage(3)}
				<Text>• </Text>
				{renderPage(total)}
			</Box>
		);
	}

	// Handle special case for the penultimate page
	if (current === total - 1) {
		return (
			<Box>
				{renderPage(1)}
				<Text>• </Text>
				{renderPage(total - 2)}
				{renderPage(total - 1)}
				{renderPage(total)}
			</Box>
		);
	}

	// Handle special case for the last page
	if (current === total) {
		return (
			<Box>
				{renderPage(1)}
				<Text>• </Text>
				{renderPage(total - 1)}
				{renderPage(total)}
			</Box>
		);
	}

	// Handle special cases for the first 3 pages
	if (current === 3) {
		return (
			<Box>
				{Array.from({length: Math.min(4, total)}, (_, i) => i + 1).map(
					renderPage,
				)}
				<Text>• </Text>
				{renderPage(total)}
			</Box>
		);
	}

	// Handle special cases for the last 3 pages
	if (current === total - 2) {
		return (
			<Box>
				{renderPage(1)}
				<Text>• </Text>
				{Array.from({length: 4}, (_, i) => total - 3 + i).map(renderPage)}
			</Box>
		);
	}

	// General case for pages in the middle
	return (
		<Box>
			{renderPage(1)}
			<Text>• </Text>
			{renderPage(current - 1)}
			{renderPage(current)}
			{renderPage(current + 1)}
			<Text>• </Text>
			{renderPage(total)}
		</Box>
	);
};

export default PaginationDisplay;
