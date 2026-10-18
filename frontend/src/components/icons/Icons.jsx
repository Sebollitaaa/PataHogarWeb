const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Svg({ children, size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...props}>
      {children}
    </svg>
  );
}

export const PawIcon = (props) => (
  <Svg {...props}>
    <ellipse cx="5.3" cy="10.6" rx="1.6" ry="2.1" transform="rotate(-22 5.3 10.6)" />
    <ellipse cx="9.3" cy="6.6" rx="1.7" ry="2.3" transform="rotate(-8 9.3 6.6)" />
    <ellipse cx="14.7" cy="6.6" rx="1.7" ry="2.3" transform="rotate(8 14.7 6.6)" />
    <ellipse cx="18.7" cy="10.6" rx="1.6" ry="2.1" transform="rotate(22 18.7 10.6)" />
    <path d="M12 12.2c-3 0-5.5 2.4-5.5 5 0 1.6 1.2 2.6 2.7 2.3 1.1-.2 1.8-.8 2.8-.8s1.7.6 2.8.8c1.5.3 2.7-.7 2.7-2.3 0-2.6-2.5-5-5.5-5Z" />
  </Svg>
);

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
);

export const BellIcon = (props) => (
  <Svg {...props}>
    <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
);

export const HeartIcon = ({ filled, ...props }) => (
  <Svg {...props} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.5s-7.5-4.6-9.8-9.4C.6 7.7 2 4.2 5.4 3.4c2-.5 4 .3 5.1 2 .3.5 1.1.5 1.4 0 1.1-1.7 3.1-2.5 5.1-2 3.4.8 4.8 4.3 3.2 7.7C19.5 15.9 12 20.5 12 20.5Z" />
  </Svg>
);

export const MessageIcon = (props) => (
  <Svg {...props}>
    <path d="M4 5h16v11H8.5L4 19.5V5Z" />
  </Svg>
);

export const UserIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c1-3.6 4-5.6 7-5.6s6 2 7 5.6" />
  </Svg>
);

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const MapPinIcon = (props) => (
  <Svg {...props}>
    <path d="M12 21s7-6.6 7-11.6A7 7 0 0 0 5 9.4C5 14.4 12 21 12 21Z" />
    <circle cx="12" cy="9.4" r="2.4" />
  </Svg>
);

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="m5 12 5 5 9-10" />
  </Svg>
);

export const XIcon = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const ChevronDownIcon = (props) => (
  <Svg {...props}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const LogOutIcon = (props) => (
  <Svg {...props}>
    <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h11m0 0-3.5-3.5M20 12l-3.5 3.5" />
  </Svg>
);

export const ShieldIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3 5 6v5.5c0 4.8 3 8 7 9.5 4-1.5 7-4.7 7-9.5V6l-7-3Z" />
  </Svg>
);

export const CameraIcon = (props) => (
  <Svg {...props}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" />
    <circle cx="12" cy="13.5" r="3.3" />
  </Svg>
);

export const EyeIcon = (props) => (
  <Svg {...props}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = (props) => (
  <Svg {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.7A17.3 17.3 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.4-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const FileIcon = (props) => (
  <Svg {...props}>
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0-1 13H9L8 7" />
  </Svg>
);

export const EditIcon = (props) => (
  <Svg {...props}>
    <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
  </Svg>
);

export const ArrowLeftIcon = (props) => (
  <Svg {...props}>
    <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
  </Svg>
);

export const FilterIcon = (props) => (
  <Svg {...props}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);

export const MenuIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const SendIcon = (props) => (
  <Svg {...props}>
    <path d="m4 12 16-7-6.5 16-2.5-7-7-2Z" />
  </Svg>
);

export const ArchiveIcon = (props) => (
  <Svg {...props}>
    <path d="M4 6h16v3H4V6Z" />
    <path d="M6 9h12v9H6V9Z" />
    <path d="M10 13h4" />
  </Svg>
);

export const AlertIcon = (props) => (
  <Svg {...props}>
    <path d="M12 4 21 19H3L12 4Z" />
    <path d="M12 10v4M12 17v.01" />
  </Svg>
);

export const WhatsAppIcon = (props) => (
  <Svg {...props}>
    <path d="M7 17.5 4.5 20 5 16a8 8 0 1 1 3.5 3l-1.5-1.5Z" />
    <path d="M9 10c0 3 2 5 5 5" />
  </Svg>
);

export const MailIcon = (props) => (
  <Svg {...props}>
    <path d="M4 6h16v12H4V6Z" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);

export const DogIcon = (props) => (
  <Svg {...props}>
    <path d="M7 8.6C7 6.1 9.2 4.5 12 4.5s5 1.6 5 4.1V13c0 3.6-2.2 6.5-5 6.5S7 16.6 7 13Z" />
    <path d="M7.3 6.9C5.7 6.3 3.7 7.1 3.2 9.1c-.4 1.9.4 3.9 1.8 4.5.9.4 1.9-.2 2-1.1" />
    <path d="M16.7 6.9c1.6-.6 3.6.2 4.1 2.2.4 1.9-.4 3.9-1.8 4.5-.9.4-1.9-.2-2-1.1" />
    <circle cx="10" cy="10.6" r=".9" fill="currentColor" stroke="none" />
    <circle cx="14" cy="10.6" r=".9" fill="currentColor" stroke="none" />
    <ellipse cx="12" cy="14.1" rx="1.4" ry="1" fill="currentColor" stroke="none" />
    <path d="M12 15.1v1.1M10.6 16.6c.8.6 2 .6 2.8 0" />
  </Svg>
);

export const CatIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 13.5c0 3.5 3.4 6 7.5 6s7.5-2.5 7.5-6V5l-4 3.2A11 11 0 0 0 12 7.6c-1.2 0-2.4.2-3.5.6L4.5 5Z" />
    <circle cx="9.3" cy="12.4" r=".9" fill="currentColor" stroke="none" />
    <circle cx="14.7" cy="12.4" r=".9" fill="currentColor" stroke="none" />
    <path d="M11.2 14.6h1.6l-.8.9Z" fill="currentColor" />
    <path d="M12 15.5c-.3.7-1 1-1.6.7M12 15.5c.3.7 1 1 1.6.7" />
  </Svg>
);

export const RabbitIcon = (props) => (
  <Svg {...props}>
    <path d="M9.4 9.2C8.3 7.4 7.8 3.3 9.2 2.8c1.4-.5 2 3 2 5.7" />
    <path d="M14.6 9.2c1.1-1.8 1.6-5.9.2-6.4-1.4-.5-2 3-2 5.7" />
    <ellipse cx="12" cy="14.6" rx="6" ry="5.4" />
    <circle cx="9.8" cy="13.8" r=".9" fill="currentColor" stroke="none" />
    <circle cx="14.2" cy="13.8" r=".9" fill="currentColor" stroke="none" />
    <ellipse cx="12" cy="16" rx="1" ry=".7" fill="currentColor" stroke="none" />
    <path d="M12 16.7v.9" />
  </Svg>
);

export const BirdIcon = (props) => (
  <Svg {...props}>
    <path d="M16.5 5.8c-2 0-3.6 1.6-3.6 3.6v.7C9 10.5 5.2 12.8 4 17.3l3.4-.6c1.3 1.5 3.2 2.3 5.4 2.3 3.6 0 6.2-2.8 6.2-6.4V9.3c0-2-1-3.5-2.5-3.5Z" />
    <path d="m19 8.2 2.4 1-2.4 1" />
    <circle cx="16.4" cy="8.7" r=".9" fill="currentColor" stroke="none" />
    <path d="M9.6 14.3c1.7-.3 3.5-1.3 4.6-2.9" />
    <path d="M11.6 19v2M14.4 18.7v2.3" />
  </Svg>
);

export const RodentIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5.6c-3.4 0-5.5 2.4-5.5 5-1.6.9-2.6 2.6-2.6 4.4 0 2.8 3.6 4.7 8.1 4.7s8.1-1.9 8.1-4.7c0-1.8-1-3.5-2.6-4.4 0-2.6-2.1-5-5.5-5Z" />
    <path d="M7.4 7.7a2 2 0 1 1 2.6-1.6M16.6 7.7a2 2 0 1 0-2.6-1.6" />
    <circle cx="9.8" cy="10.9" r=".9" fill="currentColor" stroke="none" />
    <circle cx="14.2" cy="10.9" r=".9" fill="currentColor" stroke="none" />
    <ellipse cx="12" cy="12.9" rx="1" ry=".7" fill="currentColor" stroke="none" />
    <path d="M11.4 14.3v1.5h1.2v-1.5" />
    <path d="M6.6 13.6l2 .4M17.4 13.6l-2 .4" />
  </Svg>
);

export const FishIcon = (props) => (
  <Svg {...props}>
    <path d="M3.5 12c2.5-4 6.5-5.5 10.5-4.5 2.5.6 4 2.3 4.5 4.5-.5 2.2-2 3.9-4.5 4.5-4 1-8-.5-10.5-4.5Z" />
    <path d="m18.5 12 3-3.3v6.6Z" />
    <circle cx="7.6" cy="11.2" r=".9" fill="currentColor" stroke="none" />
    <path d="M10.4 9.4c.9 1.6.9 3.6 0 5.2" />
  </Svg>
);

export const ReptileIcon = (props) => (
  <Svg {...props}>
    <path d="M3.8 15c0-4.4 3.5-7.6 7.7-7.6s7.7 3.2 7.7 7.6Z" />
    <path d="M7 11.4c3 1.3 6 1.3 9 0" />
    <path d="M19.2 13.1c.6-1.6 2.4-2.1 3.2-.9.6.9.1 2.2-1.3 2.4-.7.1-1.3 0-1.9-.2" />
    <path d="M7.2 15v2.5M15.8 15v2.5" />
    <path d="M3.8 15l-1.6.9" />
  </Svg>
);

export const FlagIcon = (props) => (
  <Svg {...props}>
    <path d="M5 21V4m0 0h11l-2 4 2 4H5" />
  </Svg>
);

export const OtherAnimalIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="8.2" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.8" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

export const ChevronLeftIcon = (props) => (
  <Svg {...props}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = (props) => (
  <Svg {...props}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const ZoomInIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.4-4.4M11 8.5v5M8.5 11h5" />
  </Svg>
);
