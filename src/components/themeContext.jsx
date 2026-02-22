export const aithemestyle = {
    statsCardGradient: 'from-[#2B125C] via-[#8E77BB] to-[#EFE7FF]',
    iconColor: '#8E77BB',
    trendup:'#82BC66',
    trendDown:'#DF7E39',
    piechart: {
        good: '#82BC66',
        average: '#FFEFC7',
        poor: '#FF565680',
        innerGradientFrom: '#EFE7FF',
        innerGradientTo: '#FFFFFF',
        labelColor: '#2B125C',
    },
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
    },
    tab: {
        activeBackground: '#FAF8FF',
        activeBorderColor: '#8E77BB',
        activeBorderWidth: '3px',
        activeTextColor: '#8E77BB',
        inactiveTextColor: '#818181',
        fontSize: '16px'
    }
}