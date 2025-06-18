import React from 'react';
import {Box, Text} from 'ink';
import Scroller from './Scroller.js';

type SetListProps = {
	sets: Array<{setId: string; setName: string}>;
	isActive: boolean;
};

export default function SetList({
	sets,
	isActive,
}: SetListProps): React.JSX.Element {
	return (
		<Box flexDirection="column" width="100%" height="100%">
			<Box flexShrink={0}>
				<Text bold color="cyan">
					Available Sets:
				</Text>
			</Box>

			<Box flexGrow={1}>
				<Scroller isActive={isActive}>
					{/* <Text>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a
							ornare arcu. Praesent at eros sed mauris bibendum dignissim non
							vitae lacus. In hac habitasse platea dictumst. Donec vehicula
							maximus elementum. Donec at felis nibh. Sed rutrum dui ante, nec
							blandit massa maximus a. Nullam at posuere nisl. Cras porttitor,
							diam non mollis porttitor, nibh dolor volutpat sapien, sagittis
							molestie purus nibh ac purus. Cras lobortis semper metus nec
							sagittis. Aliquam a lorem venenatis, euismod lorem ut, imperdiet
							felis. Vestibulum commodo laoreet odio. Nunc pellentesque orci
							quis velit porttitor, sit amet commodo risus volutpat. Praesent
							ornare convallis justo eget sodales. Nulla et libero nisl. Aenean
							quis elementum tellus. Integer a massa sed justo malesuada
							pellentesque sit amet a felis. Quisque pharetra risus urna, id
							lacinia ipsum egestas sed. Class aptent taciti sociosqu ad litora
							torquent per conubia nostra, per inceptos himenaeos. Maecenas
							luctus metus nibh, varius scelerisque ipsum mattis eget. Duis ut
							nisi quam. Morbi lobortis urna nec lacus viverra congue. Integer
							porta et dui vel blandit. Vivamus lacus augue, vulputate nec arcu
							vel, faucibus auctor risus. Vivamus ut nisl fermentum, egestas
							tortor ac, efficitur sem. Nullam non rutrum enim, sit amet
							malesuada diam. Duis vel velit nec augue varius ultrices at non
							nulla. Phasellus massa nisi, vulputate non ligula at, accumsan
							mollis ex. Vivamus interdum lectus vel ante gravida, eleifend
							elementum quam hendrerit. In vulputate porta lacus ut gravida.
							Nunc commodo imperdiet nibh sit amet suscipit. Interdum et
							malesuada fames ac ante ipsum primis in faucibus. Suspendisse
							rhoncus felis sit amet est fermentum dignissim. Nam vitae diam
							diam. Aenean faucibus massa ac velit aliquam, rutrum semper risus
							mollis. Suspendisse interdum dui quis rutrum congue. Nullam velit
							dolor, gravida ac suscipit a, tincidunt nec quam. Vivamus lectus
							velit, ornare a nibh malesuada, pulvinar dapibus erat. Praesent a
							maximus magna. Vivamus bibendum hendrerit nisl id ultrices.
							Praesent imperdiet facilisis eleifend. Phasellus tristique, nunc
							sit amet tristique venenatis, nibh urna ornare dolor, at vehicula
							tellus risus eu nibh. In facilisis turpis purus, et malesuada est
							interdum porttitor. Donec odio orci, volutpat at ex accumsan,
							tincidunt varius magna. Vivamus id lacus id ipsum iaculis
							ultricies. Pellentesque tempus, risus ac placerat bibendum, odio
							neque fermentum justo, eget vehicula turpis dui a ligula. Quisque
							quis pellentesque tellus. Aenean aliquet mollis euismod. Sed
							vestibulum nibh quam, vel euismod felis aliquam in. Vivamus
							convallis porttitor sem malesuada elementum. Proin venenatis
							blandit fermentum. Pellentesque sit amet mattis libero. Quisque
							vehicula justo quis est congue, et mollis nulla porta. Nam enim
							turpis, volutpat eget consectetur volutpat, aliquet sed lorem. Sed
							vestibulum, dui id posuere placerat, erat nunc viverra mauris, sit
							amet scelerisque nisi risus eget ex. Duis id erat velit. Etiam
							eleifend, nunc sed porttitor molestie, mi nibh auctor velit, nec
							aliquam lorem lectus non tortor. Fusce sagittis leo vel arcu
							laoreet accumsan sed quis nisl. Fusce sodales, enim eget dictum
							auctor, diam tellus luctus mauris, quis posuere neque orci ac dui.
							Nullam a nisl eu augue posuere lobortis et vel leo. Donec eget
							dolor purus. Duis volutpat scelerisque dui. Aenean ullamcorper
							euismod sodales. Morbi felis quam, convallis vitae augue in,
							pharetra hendrerit nulla. Aliquam arcu quam, cursus a porta sit
							amet, tempor in mauris. Vestibulum ante ipsum primis in faucibus
							orci luctus et ultrices posuere cubilia curae; Aliquam erat
							volutpat. Etiam ac pulvinar nunc. Nullam venenatis luctus ex, in
							tempus mi porta non. Nam tincidunt neque molestie molestie
							ullamcorper. Suspendisse in tellus vel nisl euismod pulvinar. Ut
							lacinia viverra tincidunt. Ut quis euismod velit. Curabitur
							volutpat placerat mi, hendrerit fermentum nibh interdum ut. Sed
							imperdiet libero nisi, quis lobortis leo cursus sit amet. Aliquam
							erat volutpat. Proin viverra purus quis lectus egestas, et
							pulvinar sem hendrerit. Donec accumsan ultricies dolor, at gravida
							dolor blandit eu. Praesent placerat dignissim scelerisque. Donec
							justo enim, tincidunt quis viverra in, laoreet ut nibh. Cras eget
							maximus urna. Sed blandit elit sed est commodo euismod. Morbi
							lacinia faucibus purus, ac pellentesque risus venenatis sit amet.
							Vivamus semper, ante a dictum sodales, augue arcu varius urna,
							eget feugiat elit tellus dictum diam. Phasellus vitae eros in
							ligula feugiat congue. Vestibulum et cursus dolor. Curabitur magna
							leo, lobortis nec sem sit amet, condimentum ultricies velit. Fusce
							vel mi sollicitudin, dictum sapien sit amet, tincidunt orci.
							Integer suscipit, elit eu aliquet ornare, nibh massa sollicitudin
							tellus, et posuere dolor quam vel nisl. Mauris sit amet ligula in
							lectus feugiat convallis. Mauris posuere dolor sem, a auctor
							ligula sodales id. Vivamus eget consequat massa. Phasellus
							pulvinar efficitur augue. Mauris posuere dignissim viverra.
							Curabitur sed ante dignissim, aliquet orci nec, facilisis justo.
							Etiam quis bibendum augue. Integer tincidunt massa eu lacus
							molestie molestie. Integer venenatis posuere lorem, sit amet
							aliquet dui molestie vel. Vestibulum ante ipsum primis in faucibus
							orci luctus et ultrices posuere cubilia curae; Sed porttitor odio
							vel arcu viverra, eu egestas tortor feugiat. Nullam volutpat eu
							lectus sit amet scelerisque. Aenean efficitur ultricies turpis, et
							interdum ex scelerisque sed. In hac habitasse platea dictumst.
							Donec vitae consequat enim. Donec imperdiet nisi ut dui vehicula
							interdum. Suspendisse potenti. Ut lacinia augue dui, at dignissim
							tellus fermentum at.
						</Text> */}
					{sets.map((set, index) => (
						<Box
							key={set.setId}
							flexDirection="row"
							flexShrink={0}
							width="auto"
						>
							<Text color="green">{index + 1}. </Text>
							<Text wrap="truncate">
								{set.setName} (ID: {set.setId})
								===============================================================================================================================longline
							</Text>
						</Box>
					))}
				</Scroller>
			</Box>
		</Box>
	);
}
