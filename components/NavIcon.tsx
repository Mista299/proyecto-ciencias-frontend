import React from 'react';
import Svg, { Path, Line, Circle, Polyline, Polygon, Rect } from 'react-native-svg';

interface Props {
  name: NavIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export type NavIconName =
  | 'grid'
  | 'upload-cloud'
  | 'list'
  | 'users'
  | 'layers'
  | 'map-pin'
  | 'sliders'
  | 'log-out';

const COMMON = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function NavIcon({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }: Props) {
  const s = { stroke: color, strokeWidth, ...COMMON };
  const svg = (children: React.ReactNode) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">{children}</Svg>
  );

  switch (name) {
    case 'grid':
      return svg(<>
        <Rect x="3" y="3" width="7" height="7" {...s} />
        <Rect x="14" y="3" width="7" height="7" {...s} />
        <Rect x="14" y="14" width="7" height="7" {...s} />
        <Rect x="3" y="14" width="7" height="7" {...s} />
      </>);

    case 'upload-cloud':
      return svg(<>
        <Polyline points="16 16 12 12 8 16" {...s} />
        <Line x1="12" y1="12" x2="12" y2="21" {...s} />
        <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" {...s} />
      </>);

    case 'list':
      return svg(<>
        <Line x1="8" y1="6" x2="21" y2="6" {...s} />
        <Line x1="8" y1="12" x2="21" y2="12" {...s} />
        <Line x1="8" y1="18" x2="21" y2="18" {...s} />
        <Line x1="3" y1="6" x2="3.01" y2="6" {...s} />
        <Line x1="3" y1="12" x2="3.01" y2="12" {...s} />
        <Line x1="3" y1="18" x2="3.01" y2="18" {...s} />
      </>);

    case 'users':
      return svg(<>
        <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...s} />
        <Circle cx="9" cy="7" r="4" {...s} />
        <Path d="M23 21v-2a4 4 0 0 0-3-3.87" {...s} />
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" {...s} />
      </>);

    case 'layers':
      return svg(<>
        <Polygon points="12 2 2 7 12 12 22 7 12 2" {...s} />
        <Polyline points="2 17 12 22 22 17" {...s} />
        <Polyline points="2 12 12 17 22 12" {...s} />
      </>);

    case 'map-pin':
      return svg(<>
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" {...s} />
        <Circle cx="12" cy="10" r="3" {...s} />
      </>);

    case 'sliders':
      return svg(<>
        <Line x1="4" y1="21" x2="4" y2="14" {...s} />
        <Line x1="4" y1="10" x2="4" y2="3" {...s} />
        <Line x1="12" y1="21" x2="12" y2="12" {...s} />
        <Line x1="12" y1="8" x2="12" y2="3" {...s} />
        <Line x1="20" y1="21" x2="20" y2="16" {...s} />
        <Line x1="20" y1="12" x2="20" y2="3" {...s} />
        <Line x1="1" y1="14" x2="7" y2="14" {...s} />
        <Line x1="9" y1="8" x2="15" y2="8" {...s} />
        <Line x1="17" y1="16" x2="23" y2="16" {...s} />
      </>);

    case 'log-out':
      return svg(<>
        <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...s} />
        <Polyline points="16 17 21 12 16 7" {...s} />
        <Line x1="21" y1="12" x2="9" y2="12" {...s} />
      </>);

    default:
      return svg(<Circle cx="12" cy="12" r="4" {...s} />);
  }
}
