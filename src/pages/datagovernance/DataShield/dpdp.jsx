import { useState } from "react";
import {
    RefreshCw, Trash2, Play, BellRing, Link2,
    MoreHorizontal,
    RotateCw,
    List,
    RefreshCcw,
    Code,
    Plus,
    LinkIcon,
    Ellipsis,
    X,
    Pencil
} from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";

const Toggle = ({ enabled, onToggle }) => {
    return (
        <div
            onClick={onToggle}
            className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${enabled ? "bg-[#1a9962]" : "bg-red-500"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${enabled ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </div>
    );
};

export default function DPDP() {
    const components = [
        "Restrict access to personal data",
        "Right to access personal data",
        "Right to errasor",
        "Right to data portability",
        "Right to information",
        "Right to restriction",
        "Right to nominate correct merger",
    ];

    const [selected, setSelected] = useState([]);
    const [enabled, setEnabled] = useState(
        components.reduce((acc, c) => ({ ...acc, [c]: true }), {})
    );

    const [componentsModal, setComponentsModal] = useState(false);
    const toggleSelect = (name, id) => {
        console.log("id is ====>", id)
        if (id == 0) {
            setComponentsModal(true)
        }
        setSelected((prev) =>
            prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
        );
    };

    const toggleAll = () => {
        setSelected(selected.length === components.length ? [] : components);
    };

    const [activeMenu, setActiveMenu] = useState(null);

    const handleClickOutside = () => {
        setActiveMenu(null);
    };

    const [isOpen, setIsOpen] = useState(false);

    const data = [
        {
            id: '#464ADE',
            age: 24,
            status: 'Fulfilment success',
            email: 'abc@gmail.com',
            startDate: '24/10/2024',
            submissionDate: '24/10/2024',
            statusColor: 'bg-emerald-100 text-emerald-700',
        },
        {
            id: '#464ADE',
            age: 24,
            status: 'Awaiting action',
            email: 'abc@gmail.com',
            startDate: '24/10/2024',
            submissionDate: '24/10/2024',
            statusColor: 'bg-amber-100 text-amber-800',
        },
        {
            id: '#464ADE',
            age: 24,
            status: 'In - progress',
            email: 'abc@gmail.com',
            startDate: '24/10/2024',
            submissionDate: '24/10/2024',
            statusColor: 'bg-slate-200 text-slate-700',
        },
        {
            id: '#464ADE',
            age: 24,
            status: 'Cancelled',
            email: 'abc@gmail.com',
            startDate: '24/10/2024',
            submissionDate: '24/10/2024',
            statusColor: 'bg-rose-100 text-rose-600',
        },
        {
            id: '#464ADE',
            age: 24,
            status: 'On hold',
            email: 'abc@gmail.com',
            startDate: '24/10/2024',
            submissionDate: '24/10/2024',
            statusColor: 'bg-sky-100 text-sky-700',
        },
    ];

    const [isLinkOpen, setIsLinkOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('purpose');
    const [activeSection, setActiveSection] = useState('data');


    const [sampleData, setSampleData] = useState([
        { id: '1', Tag: 'Tag 1', subtag: 'Sub tag 1', category: 'category', subcategory: 'sub category 1', startDate: '27/01/2025', Select: false },
        { id: '1', Tag: 'Tag 1', subtag: 'Sub tag 1', category: 'category', subcategory: 'sub category 1', startDate: '27/01/2025', Select: false },
        { id: '1', Tag: 'Tag 1', subtag: 'Sub tag 1', category: 'category', subcategory: 'sub category 1', startDate: '27/01/2025', Select: false },
        { id: '1', Tag: 'Tag 1', subtag: 'Sub tag 1', category: 'category', subcategory: 'sub category 1', startDate: '27/01/2025', Select: false },
        { id: '1', Tag: 'Tag 1', subtag: 'Sub tag 1', category: 'category', subcategory: 'sub category 1', startDate: '27/01/2025', Select: false },
        { id: '1', Tag: 'Tag 1', subtag: 'Sub tag 1', category: 'category', subcategory: 'sub category 1', startDate: '27/01/2025', Select: false }
    ]);

    const [selectAll, setSelectAll] = useState(false);

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        setSampleData(prev =>
            prev.map(item => ({ ...item, Select: newSelectAll }))
        );
    };

    const handleSelectRow = (index) => {
        const updated = [...sampleData];
        updated[index].Select = !updated[index].Select;
        setSampleData(updated);
        setSelectAll(updated.every(row => row.Select));
    };


    const [activeDataMenu, setActiveDataMenu] = useState(null);

    const handleClickDataOutside = () => {
        setActiveDataMenu(null);
    };

    const [applyStep, setApplyStep] = useState(1);

    return (
        <>
            <div className="p-6 bg-gray-50">
                <Breadcrumb title="Data Governance" link="/" />
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-2xl font-semibold">DPDP</h1>
                    <div className="flex items-center gap-2">
                        <button type="button"
                            onClick={() => setIsOpen(true)}
                            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 py-2.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                            <div className="flex justify-between items-center">
                                <BellRing className="h-4 w-4 mr-2" />
                                Alerts
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLinkOpen(true)}
                            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 py-2.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                            <div className="flex justify-between items-center">
                                <Link2 className="h-4 w-4 mr-2" />
                                Link
                            </div>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white shadow rounded-xl p-5">
                        <h2 className="text-lg font-semibold mb-4">DPDP Overview</h2>
                        <p className="text-sm text-gray-700">
                            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s...
                            <br /><br />
                            It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages...
                        </p>
                    </div>

                    <div className="bg-white shadow rounded-xl p-5">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Components</h2>
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    checked={selected.length === components.length}
                                    onChange={toggleAll}
                                    className="form-checkbox h-4 w-4 text-blue-600"
                                />
                                Select all
                            </label>
                        </div>

                        <ul className="">
                            {components.map((component, index) => (
                                <li
                                    key={component}
                                    className="flex justify-between items-center p-3 border-b-2 border-gray-300"

                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(component)}
                                            onChange={() => toggleSelect(component, index)}
                                            className="form-checkbox h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-sm text-gray-800">{component}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <button
                                                onClick={() =>
                                                    setActiveMenu(activeMenu === index ? null : index)
                                                }
                                                className="p-1.5 rounded-full hover:bg-gray-100"
                                            >
                                                <Ellipsis className="h-5 w-5" />
                                            </button>
                                            {activeMenu === index && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={handleClickOutside}
                                                    />
                                                    <div className="absolute right-0 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                                        <div className="flex items-center p-1 gap-1">

                                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <RotateCw className="h-4 w-4" />
                                                            </button>
                                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <Play className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <Toggle
                                            enabled={enabled[component]}
                                            onToggle={() =>
                                                setEnabled((prev) => ({
                                                    ...prev,
                                                    [component]: !prev[component],
                                                }))
                                            }
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4">
                            <h2 className="text-xl font-semibold text-[#8e78b7]">Alerts</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className=" absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-hidden mx-5">
                            <table className="font-normal text-sm w-full">
                                <thead>
                                    <tr className="bg-gray-700 text-white">
                                        <th className="px-4 py-3">Request ID</th>
                                        <th className="px-4 py-3">Request age</th>
                                        <th className="px-4 py-3">Request status</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Start date</th>
                                        <th className="px-4 py-3">Submission date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-4 text-gray-500 ">{row.id}</td>
                                            <td className="p-4 text-gray-500 text-center">{row.age}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`px-3 py-1.5 rounded text-xs font-semibold ${row.statusColor}`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-center">{row.email}</td>
                                            <td className="p-4 text-gray-500 text-center">{row.startDate}</td>
                                            <td className="p-4 text-gray-500 text-center">{row.submissionDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end px-6 py-4 ">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-[#8e78b7] text-white px-7 py-2 rounded-lg shadow transition duration-200"
                            >
                                Okay!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLinkOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                        <button
                            onClick={() => setIsLinkOpen(false)}
                            className=" absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-lg font-semibold text-[#8e78b7] flex items-center mb-2">
                            Link
                        </h2>

                        <p className="font-semibold text-sm text-gray-700 mb-2">Right to delete</p>

                        <p className="text-sm text-gray-500 mb-6">
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Iste autem exercitationem illo rerum dolores soluta sapiente ipsum officiis cumque in modi laudantium ratione nemo commodi distinctio nostrum vero, sint neque.
                        </p>

                        <p className="text-sm text-[#8e78b7] font-semibold mb-2">Details</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Mobile no</label>
                                <input
                                    type="text"
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Gender</label>
                                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                    <option value="">Select</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center mb-6">
                            <input id="request-delete" type="checkbox" className="mr-2" />
                            <label htmlFor="request-delete" className="text-sm text-gray-600">
                                Request for data deletion
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsLinkOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button className="px-4 py-2 bg-[#8e78b7] text-white rounded-md text-sm ">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {componentsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl px-6 py-4 relative">
                        <h1 className="text-xl font-bold text-gray-800 mb-4">Restrict access to personal data</h1>
                        <button
                            onClick={() => setComponentsModal(false)}
                            className=" absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex space-x-4 mb-4">
                            <button
                                className={`px-5 py-1.5 font-medium rounded-md ${activeTab === 'purpose' ? 'bg-purple-200 text-[#8e78b7]' : 'bg-gray-200 text-gray-600'}`}
                                onClick={() => setActiveTab('purpose')}
                            >
                                Purpose
                            </button>
                            <button
                                className={`px-5 py-1.5 font-medium rounded-md ${activeTab === 'applyFor' ? 'bg-purple-200 text-[#8e78b7]' : 'bg-gray-200 text-gray-600'}`}
                                onClick={() => setActiveTab('applyFor')}
                            >
                                Apply for
                            </button>
                        </div>

                        {activeTab === 'purpose' && (
                            <p className="text-gray-600 text-sm mb-2">
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                            </p>
                        )}
                        {activeTab === 'purpose' && (
                            <div className="flex space-x-4 mb-4">
                                <button
                                    className={`px-5 py-2 font-medium  ${activeSection === 'when' ? 'border-b-2 border-[#8e78b7] text-[#8e78b7]' : 'text-gray-700'}`}
                                    onClick={() => setActiveSection('when')}
                                >
                                    When
                                </button>
                                <button
                                    className={`px-5 py-2 font-medium ${activeSection === 'data' ? 'border-b-2 border-[#8e78b7] text-[#8e78b7]' : 'text-gray-700'}`}
                                    onClick={() => setActiveSection('data')}
                                >
                                    Data
                                </button>
                            </div>
                        )}
                        {(activeTab === 'purpose' && activeSection === 'data') && (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <div className="overflow-x-auto">
                                        <table className="font-normal text-sm w-full">
                                            <thead>
                                                <tr className="bg-gray-700 text-white sticky top-0">
                                                    <th className="px-4 py-3 min-w-[50px]">ID</th>
                                                    <th className="px-4 py-3 min-w-[100px]">Tag</th>
                                                    <th className="px-4 py-3 min-w-[100px]">Sub tag</th>
                                                    <th className="px-4 py-3 min-w-[120px]">Category</th>
                                                    <th className="px-4 py-3 min-w-[140px]">Sub category</th>
                                                    <th className="px-4 py-3 min-w-[120px]">Start Date</th>
                                                    <th className="p-4 min-w-[120px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span>Select All</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectAll}
                                                                onChange={handleSelectAll}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th className="text-left p-4 min-w-[100px]">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sampleData.map((row, index) => (
                                                    <tr key={index} className="border-b">
                                                        <td className="p-4 text-gray-500">{row.id}</td>
                                                        <td className="p-4 text-gray-500 text-center">{row.Tag}</td>
                                                        <td className="p-4 text-gray-500 text-center">{row.subtag}</td>
                                                        <td className="p-4 text-gray-500 text-center">{row.category}</td>
                                                        <td className="p-4 text-gray-500 text-center">{row.subcategory}</td>
                                                        <td className="p-4 text-gray-500 text-center">{row.startDate}</td>
                                                        <td className="p-4 text-gray-500 text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="transform scale-125"
                                                                checked={row.Select}
                                                                onChange={() => handleSelectRow(index)}
                                                            />
                                                        </td>
                                                        <td className="px-6 p-4 text-center">
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setActiveDataMenu(activeDataMenu === index ? null : index)}
                                                                    className="p-1.5 rounded-full hover:bg-gray-100"
                                                                >
                                                                    <MoreHorizontal className="h-5 w-5" />
                                                                </button>

                                                                {activeDataMenu === index && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-100" onClick={handleClickDataOutside} />
                                                                        <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                                                            <div className="flex items-center p-1 gap-1">
                                                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                                    <Pencil className="h-4 w-4" />
                                                                                </button>
                                                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                                    <RotateCw className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'purpose' && activeSection === 'when') && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1 font-medium ">Tag</label>
                                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                        <option value="">Select</option>
                                        <option>tag1</option>
                                        <option>tag2</option>
                                        <option>tag3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1 font-medium ">Sub-tag</label>
                                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                        <option value="">Select</option>
                                        <option>sub-tag1</option>
                                        <option>sub-tag2</option>
                                        <option>sub-tag3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1 font-medium ">Category</label>
                                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                        <option value="">Select</option>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1 font-medium ">Sub-category</label>
                                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                        <option value="">Select</option>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'purpose' && (
                            <div className="flex mt-6 space-x-3">
                                <button
                                    className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-7 py-2 bg-[#8e78b7] text-white rounded-md  focus:outline-none focus:ring-2 focus:ring-offset-2"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        {activeTab === 'applyFor' && (
                            applyStep === 1 ? (
                                <div>
                                    <div className="flex w-full justify-between">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 w-[82%]">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1 font-medium">Role</label>
                                                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                                    <option value="">Select</option>
                                                    <option>tag1</option>
                                                    <option>tag2</option>
                                                    <option>tag3</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1 font-medium">Persona</label>
                                                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                                    <option value="">Select</option>
                                                    <option>sub-tag1</option>
                                                    <option>sub-tag2</option>
                                                    <option>sub-tag3</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1 font-medium">Group</label>
                                                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                                    <option value="">Select</option>
                                                    <option>Male</option>
                                                    <option>Female</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1 font-medium">Sub-group</label>
                                                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-500">
                                                    <option value="">Select</option>
                                                    <option>Male</option>
                                                    <option>Female</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-center w-[10%]">
                                            <button className="px-5 py-1.5 flex items-center text-[#8e78b7] rounded-md border border-[#8e78b7]">
                                                <Plus className="h-4 w-4 inline-block mr-1 text-[#8e78b7]" />
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex mt-6 space-x-3">
                                        <button className="px-7 py-2 bg-[#8e78b7] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2">
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setApplyStep(2)}
                                            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="max-h-[270px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            <div className="overflow-x-auto">
                                                <table className="font-normal text-sm w-full">
                                                    <thead>
                                                        <tr className="bg-gray-700 text-white sticky top-0">
                                                            <th className="px-4 py-3 min-w-[50px]">ID</th>
                                                            <th className="px-4 py-3 min-w-[100px]">Tag</th>
                                                            <th className="px-4 py-3 min-w-[100px]">Sub tag</th>
                                                            <th className="px-4 py-3 min-w-[120px]">Category</th>
                                                            <th className="px-4 py-3 min-w-[140px]">Sub category</th>
                                                            <th className="px-4 py-3 min-w-[120px]">Start Date</th>
                                                            <th className="p-4 min-w-[120px]">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span>Select All</span>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectAll}
                                                                        onChange={handleSelectAll}
                                                                    />
                                                                </div>
                                                            </th>
                                                            <th className="text-left p-4 min-w-[100px]">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sampleData.map((row, index) => (
                                                            <tr key={index} className="border-b">
                                                                <td className="p-4 text-gray-500">{row.id}</td>
                                                                <td className="p-4 text-gray-500 text-center">{row.Tag}</td>
                                                                <td className="p-4 text-gray-500 text-center">{row.subtag}</td>
                                                                <td className="p-4 text-gray-500 text-center">{row.category}</td>
                                                                <td className="p-4 text-gray-500 text-center">{row.subcategory}</td>
                                                                <td className="p-4 text-gray-500 text-center">{row.startDate}</td>
                                                                <td className="p-4 text-gray-500 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="transform scale-125"
                                                                        checked={row.Select}
                                                                        onChange={() => handleSelectRow(index)}
                                                                    />
                                                                </td>
                                                                <td className="px-6 p-4 text-center">
                                                                    <div className="relative">
                                                                        <button
                                                                            onClick={() => setActiveDataMenu(activeDataMenu === index ? null : index)}
                                                                            className="p-1.5 rounded-full hover:bg-gray-100"
                                                                        >
                                                                            <MoreHorizontal className="h-5 w-5" />
                                                                        </button>

                                                                        {activeDataMenu === index && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-100" onClick={handleClickDataOutside} />
                                                                                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                                                                    <div className="flex items-center p-1 gap-1">
                                                                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                                            <Pencil className="h-4 w-4" />
                                                                                        </button>
                                                                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </button>
                                                                                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                                            <RotateCw className="h-4 w-4" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex mt-6 space-x-3">
                                        <button
                                            onClick={() => setApplyStep(1)}
                                            className="px-7 py-2 bg-[#8e78b7] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2">
                                            Back
                                        </button>
                                        <button
                                            onClick={() => setComponentsModal(false)}
                                            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

        </>
    );
}
