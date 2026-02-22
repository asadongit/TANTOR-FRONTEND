export const aithemestyle = {
    statsCardGradient: 'from-[#2B125C] via-[#8E77BB] to-[#EFE7FF]',
    iconColor: '#8E77BB',
    trendup:'#82BC66',
    trendDown:'#DF7E39',
    piechart: {},
    modelLifecycleColors: {
        deployed: '#FF9500',
        saved: '#268EDD',
        archived: '#0663AA'
    },
    tokenUsageChart: {
        line: '#8E77BB',
        area: 'url(#tokenUsageGradient)',
        dot: '#8E77BB',
        gradientFrom: '#EFE7FF',
        gradientTo: '#8E77BB',
        background: 'linear-gradient(180deg, #BCD2FD 0%, #FFFFFF 101.86%)',
        border: '2px solid',
        borderImage: 'linear-gradient(180deg, #8E77BB 0%, #FFFFFF 96.58%)'
    },
    recentActivityStatus: {
        deployed: { bg: '#F9E1D6', text: '#000000' },
        archived: { bg: '#F9EDC1', text: '#000000' },
        active:   { bg: '#2AC79240', text: '#000000' },
        inactive: { bg: '#F276A74D', text: '#000000' },
        default:  { bg: '#E5E7EB', text: '#000000' }
    },
    agentIconColors: [
        { icon: '#D3967A', bg: '#F9E1D6' },
        // { icon: '#8E77BB', bg: '#FD9CFF33' },
        // { icon: '#3C6AC380', bg: '#AEC9FE80' },
    ],
    popularUsecaseColors: {
        iconBackground: '#E4F6FF',
        iconColor: '#5F83B0'
    }
}

export const tw = {
    pageHeading:    'font-satoshi text-2xl font-medium text-[#332849] leading-none tracking-normal',
    sectionHeading: 'font-satoshi text-base font-medium text-[#332849] leading-none tracking-normal',
    cardTitle:      'font-satoshi text-sm font-medium text-[#332849] leading-none tracking-normal',
    label:          'font-satoshi text-sm font-normal text-[#332849] leading-none tracking-normal',
    body:           'font-satoshi text-base font-normal text-[#818181] leading-none tracking-normal',
    caption:        'font-satoshi text-xs font-normal text-[#818181] leading-none tracking-normal',
    icon:           'text-[#818181]'
};

export const backgrounds = {
    page: 'bg-gray-50'
};