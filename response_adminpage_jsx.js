import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/AdminDashboard.jsx");import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false};import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react-swc can't detect preamble. Something is wrong."
    );
  }

  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}

import __vite__cjsImport2_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=ebe23be0"; const _jsxDEV = __vite__cjsImport2_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=ebe23be0"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react; const useEffect = __vite__cjsImport3_react["useEffect"]; const useMemo = __vite__cjsImport3_react["useMemo"]; const useState = __vite__cjsImport3_react["useState"];
import { ref, onValue, remove, update, get } from "/node_modules/.vite/deps/firebase_database.js?v=ebe23be0";
import { database, auth } from "/src/firebase/firebaseConfig.jsx";
import { CSVLink } from "/node_modules/.vite/deps/react-csv.js?v=ebe23be0";
import { Link, useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=ebe23be0";
import emailjs from "/node_modules/.vite/deps/@emailjs_browser.js?v=ebe23be0";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "/node_modules/.vite/deps/recharts.js?v=ebe23be0";
import { FiActivity, FiCalendar, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiDownload, FiEdit3, FiEye, FiMail, FiSearch, FiTrash2, FiTrendingUp, FiUsers, FiX } from "/node_modules/.vite/deps/react-icons_fi.js?v=ebe23be0";
import RemoteAdminOverview from "/src/components/common/RemoteAdminOverview.jsx";
import "/src/pages/admin-dashboard-troop.css";
import { useSalesTrend } from "/src/hooks/useSalesTrend.js";
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";
const formatNaira = (value)=>`NGN ${Number(value || 0).toLocaleString()}`;
const AdminDashboard = ()=>{
    _s();
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [showEventList, setShowEventList] = useState(false);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [resendingId, setResendingId] = useState(null);
    const itemsPerPage = 10;
    useEffect(()=>{
        const eventsRef = ref(database, "events");
        onValue(eventsRef, (snapshot)=>{
            const data = snapshot.val() || {};
            setEvents(Object.entries(data).map(([id, value])=>({
                    id,
                    ...value
                })));
        });
        const ticketsRef = ref(database, "tickets");
        onValue(ticketsRef, (snapshot)=>{
            const data = snapshot.val() || {};
            setTickets(Object.entries(data).map(([id, value])=>({
                    id,
                    ...value,
                    date: value.timestamp ? new Date(value.timestamp).toLocaleDateString() : "N/A"
                })));
        });
        const withdrawalsRef = ref(database, "withdrawalRequests");
        onValue(withdrawalsRef, (snapshot)=>{
            const data = snapshot.val() || {};
            const requestsArray = Object.entries(data).map(([id, value])=>({
                    id,
                    ...value
                })).sort((left, right)=>(right.timestamp || 0) - (left.timestamp || 0));
            setWithdrawals(requestsArray);
        });
    }, []);
    const totalEvents = events.length;
    const totalTicketsSold = tickets.reduce((sum, ticket)=>sum + (ticket.quantity || 1), 0);
    const totalRevenue = tickets.reduce((sum, ticket)=>sum + (ticket.totalCharged || ticket.totalPaid || 0), 0);
    const platformRevenue = tickets.reduce((sum, ticket)=>sum + ((ticket.hostFee || 0) + (ticket.serviceFee || 0)), 0);
    const totalAttendees = new Set(tickets.map((ticket)=>ticket.email)).size;
    const totalPaidOut = withdrawals.filter((withdrawal)=>withdrawal.status === "completed").reduce((sum, withdrawal)=>sum + (withdrawal.amount || 0), 0);
    const pendingCount = withdrawals.filter((withdrawal)=>withdrawal.status === "pending").length;
    const hostBreakdown = useMemo(()=>{
        const breakdown = tickets.reduce((accumulator, ticket)=>{
            const hostEmail = ticket.hostEmail || "Unknown";
            if (!accumulator[hostEmail]) {
                accumulator[hostEmail] = {
                    hostEmail,
                    totalEarned: 0,
                    tickets: 0,
                    withdrawn: 0
                };
            }
            accumulator[hostEmail].totalEarned += ticket.totalPaid || 0;
            accumulator[hostEmail].tickets += ticket.quantity || 1;
            return accumulator;
        }, {});
        withdrawals.filter((withdrawal)=>withdrawal.status === "completed").forEach((withdrawal)=>{
            const hostEmail = withdrawal.hostEmail;
            if (breakdown[hostEmail]) {
                breakdown[hostEmail].withdrawn += withdrawal.amount || 0;
            }
        });
        return Object.values(breakdown).map((host)=>({
                ...host,
                stillOwed: Math.max(0, host.totalEarned - host.withdrawn)
            })).sort((left, right)=>right.totalEarned - left.totalEarned);
    }, [
        tickets,
        withdrawals
    ]);
    const totalOwedToHosts = hostBreakdown.reduce((sum, host)=>sum + host.stillOwed, 0);
    const salesData = Object.values(tickets.reduce((accumulator, ticket)=>{
        const date = new Date(ticket.timestamp || Date.now()).toLocaleDateString();
        accumulator[date] = accumulator[date] || {
            date,
            total: 0
        };
        accumulator[date].total += ticket.totalPaid || 0;
        return accumulator;
    }, {}));
    // remote sales trend (from server aggregates)
    const { data: remoteSales, isLoading: remoteSalesLoading } = useSalesTrend(30);
    const filteredTickets = tickets.sort((left, right)=>(right.timestamp || 0) - (left.timestamp || 0)).filter((ticket)=>{
        const eventExists = events.some((event)=>event.id === ticket.eventId);
        const matchingEventTitle = events.find((event)=>event.id === ticket.eventId)?.title || "";
        const normalizedSearch = searchTerm.toLowerCase();
        const matchesSearch = ticket.email?.toLowerCase().includes(normalizedSearch) || matchingEventTitle.toLowerCase().includes(normalizedSearch);
        return eventExists && matchesSearch;
    });
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const sendAudit = async (action, details)=>{
        try {
            if (!auth || !auth.currentUser) return;
            const token = await auth.currentUser.getIdToken(true);
            await fetch('/admin/audit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    action,
                    details
                })
            });
        } catch (err) {
            console.warn('Failed to send audit log', err);
        }
    };
    const handleDeleteEvent = async (eventId)=>{
        if (window.confirm("Are you sure you want to delete this event and all its tickets?")) {
            try {
                const ticketsRef = ref(database, "tickets");
                const snapshot = await get(ticketsRef);
                if (snapshot.exists()) {
                    const ticketsData = snapshot.val();
                    const deletePromises = Object.entries(ticketsData).filter(([, ticket])=>ticket.eventId === eventId).map(([ticketId])=>remove(ref(database, `tickets/${ticketId}`)));
                    await Promise.all(deletePromises);
                }
                await remove(ref(database, `events/${eventId}`));
                // audit
                sendAudit('delete_event', {
                    eventId
                });
                alert("Event and all its tickets deleted successfully.");
            } catch (error) {
                alert(`Error deleting event: ${error.message}`);
            }
        }
    };
    const handleWithdrawalStatus = async (id, status)=>{
        try {
            await update(ref(database, `withdrawalRequests/${id}`), {
                status
            });
            // audit
            sendAudit('withdrawal_update', {
                id,
                status
            });
            alert(`Request marked as ${status}.`);
        } catch (error) {
            alert(`Failed to update status: ${error.message}`);
        }
    };
    const handleResendEmail = async (ticket)=>{
        if (!ticket.email) {
            alert("No email address found for this ticket.");
            return;
        }
        setResendingId(ticket.id);
        const event = events.find((currentEvent)=>currentEvent.id === ticket.eventId);
        const ticketPrice = ticket.totalPaid || 0;
        const totalPaid = ticket.totalCharged || ticket.totalPaid || 0;
        if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
            try {
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                    to_email: ticket.email,
                    user_name: ticket.name || ticket.email,
                    event_name: ticket.eventTitle || event?.title || "Your Event",
                    event_date: event?.date || "",
                    event_location: event?.location || "",
                    ticket_type: ticket.ticketType || "",
                    quantity: String(ticket.quantity || 1),
                    unit_price: ticketPrice.toLocaleString(),
                    total_paid: totalPaid.toLocaleString(),
                    order_id: ticket.transactionId || ticket.id,
                    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.transactionId || ticket.id)}`,
                    support_email: "Ekotix234@gmail.com",
                    company_name: "Ekotix",
                    current_year: String(new Date().getFullYear())
                }, EMAILJS_PUBLIC_KEY);
                // audit
                sendAudit('resend_ticket_email', {
                    ticketId: ticket.id,
                    to: ticket.email
                });
                alert(`Email resent successfully to ${ticket.email}`);
            } catch (error) {
                console.error("EmailJS error:", error);
                alert(`Failed to resend email: ${error.text || error.message}`);
            }
        } else {
            console.warn("EmailJS is not configured. Skipping resend email.");
            alert("Ticket email was not resent because EmailJS is not configured.");
        }
        setResendingId(null);
    };
    const getStatusBadgeClass = (status)=>`admin-status admin-status-${status || "pending"}`;
    return /*#__PURE__*/ _jsxDEV("div", {
        className: "admin-dashboard",
        children: [
            /*#__PURE__*/ _jsxDEV("section", {
                className: "admin-hero",
                children: [
                    /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-hero-copy",
                        children: [
                            /*#__PURE__*/ _jsxDEV("span", {
                                className: "admin-kicker",
                                children: "Operations center"
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 264,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("h1", {
                                children: "Run Ekotix with clarity"
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 265,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("p", {
                                children: "Oversee platform revenue, track event performance, review withdrawals, and manage ticket activity from one premium control room."
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 266,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-hero-actions",
                                children: [
                                    /*#__PURE__*/ _jsxDEV(Link, {
                                        to: "/event/new",
                                        className: "admin-primary-btn button-primary",
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(FiCalendar, {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 271,
                                                columnNumber: 15
                                            }, this),
                                            "Create New Event"
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 270,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV("button", {
                                        type: "button",
                                        className: "admin-secondary-btn",
                                        onClick: ()=>setShowEventList(true),
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(FiEye, {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 279,
                                                columnNumber: 15
                                            }, this),
                                            "View Event Index"
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 274,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV(CSVLink, {
                                        data: filteredTickets,
                                        filename: "tickets.csv",
                                        className: "admin-secondary-btn",
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(FiDownload, {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 283,
                                                columnNumber: 15
                                            }, this),
                                            "Export Tickets"
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 282,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 269,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 263,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-hero-aside",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-hero-stat",
                                children: [
                                    /*#__PURE__*/ _jsxDEV("span", {
                                        children: "Live events"
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 291,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV("strong", {
                                        children: totalEvents
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 292,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV("small", {
                                        children: "All active and archived event records"
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 293,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 290,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-hero-stat",
                                children: [
                                    /*#__PURE__*/ _jsxDEV("span", {
                                        children: "Pending withdrawals"
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 296,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV("strong", {
                                        children: pendingCount
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 297,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV("small", {
                                        children: "Requests needing finance review"
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 298,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 295,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 289,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                lineNumber: 262,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV("section", {
                className: "admin-kpi-grid",
                children: /*#__PURE__*/ _jsxDEV("div", {
                    style: {
                        width: '100%'
                    },
                    children: /*#__PURE__*/ _jsxDEV(RemoteAdminOverview, {}, void 0, false, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 307,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                    lineNumber: 305,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                lineNumber: 304,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV("section", {
                className: "admin-finance-grid",
                children: [
                    /*#__PURE__*/ _jsxDEV("article", {
                        className: "admin-finance-card admin-finance-card-emerald",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-finance-head",
                                children: /*#__PURE__*/ _jsxDEV("span", {
                                    className: "admin-panel-chip",
                                    children: [
                                        /*#__PURE__*/ _jsxDEV(FiTrendingUp, {
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 315,
                                            columnNumber: 15
                                        }, this),
                                        "Platform revenue"
                                    ]
                                }, void 0, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 314,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 313,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("strong", {
                                children: formatNaira(platformRevenue)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 319,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("p", {
                                children: "5% host fee plus NGN 100 service fee per ticket."
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 320,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ _jsxDEV("article", {
                        className: "admin-finance-card admin-finance-card-amber",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-finance-head",
                                children: /*#__PURE__*/ _jsxDEV("span", {
                                    className: "admin-panel-chip",
                                    children: [
                                        /*#__PURE__*/ _jsxDEV(FiCheckCircle, {
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 326,
                                            columnNumber: 15
                                        }, this),
                                        "Total paid out"
                                    ]
                                }, void 0, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 325,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 324,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("strong", {
                                children: formatNaira(totalPaidOut)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 330,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("p", {
                                children: "Completed withdrawals already processed to hosts."
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 331,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 323,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ _jsxDEV("article", {
                        className: "admin-finance-card admin-finance-card-blue",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-finance-head",
                                children: /*#__PURE__*/ _jsxDEV("span", {
                                    className: "admin-panel-chip",
                                    children: [
                                        /*#__PURE__*/ _jsxDEV(FiActivity, {
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 337,
                                            columnNumber: 15
                                        }, this),
                                        "Still owed to hosts"
                                    ]
                                }, void 0, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 336,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 335,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("strong", {
                                children: formatNaira(totalOwedToHosts)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 341,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("p", {
                                children: "Total host earnings remaining after settled payouts."
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 342,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 334,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                lineNumber: 311,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV("section", {
                className: "admin-main-grid",
                children: [
                    /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-panel",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-panel-head",
                                children: /*#__PURE__*/ _jsxDEV("div", {
                                    children: [
                                        /*#__PURE__*/ _jsxDEV("span", {
                                            className: "admin-panel-chip",
                                            children: [
                                                /*#__PURE__*/ _jsxDEV(FiUsers, {
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 351,
                                                    columnNumber: 17
                                                }, this),
                                                "Host overview"
                                            ]
                                        }, void 0, true, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 350,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ _jsxDEV("h2", {
                                            children: "Per host payout breakdown"
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 354,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 349,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 348,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-table-wrap",
                                children: /*#__PURE__*/ _jsxDEV("table", {
                                    className: "admin-table admin-table-stacked",
                                    children: [
                                        /*#__PURE__*/ _jsxDEV("thead", {
                                            children: /*#__PURE__*/ _jsxDEV("tr", {
                                                children: [
                                                    /*#__PURE__*/ _jsxDEV("th", {
                                                        children: "Host Email"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 362,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ _jsxDEV("th", {
                                                        children: "Tickets Sold"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 363,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ _jsxDEV("th", {
                                                        children: "Total Earned"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 364,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ _jsxDEV("th", {
                                                        children: "Total Withdrawn"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 365,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ _jsxDEV("th", {
                                                        children: "Still Owed"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 366,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 361,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 360,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ _jsxDEV("tbody", {
                                            children: hostBreakdown.map((host)=>/*#__PURE__*/ _jsxDEV("tr", {
                                                    children: [
                                                        /*#__PURE__*/ _jsxDEV("td", {
                                                            "data-label": "Host Email",
                                                            children: host.hostEmail
                                                        }, void 0, false, {
                                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                            lineNumber: 372,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ _jsxDEV("td", {
                                                            "data-label": "Tickets Sold",
                                                            children: host.tickets
                                                        }, void 0, false, {
                                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                            lineNumber: 373,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ _jsxDEV("td", {
                                                            "data-label": "Total Earned",
                                                            className: "admin-value admin-value-emerald",
                                                            children: formatNaira(host.totalEarned)
                                                        }, void 0, false, {
                                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                            lineNumber: 374,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ _jsxDEV("td", {
                                                            "data-label": "Total Withdrawn",
                                                            className: "admin-value admin-value-amber",
                                                            children: formatNaira(host.withdrawn)
                                                        }, void 0, false, {
                                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                            lineNumber: 377,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ _jsxDEV("td", {
                                                            "data-label": "Still Owed",
                                                            className: `admin-value ${host.stillOwed > 0 ? "admin-value-blue" : "admin-value-muted"}`,
                                                            children: formatNaira(host.stillOwed)
                                                        }, void 0, false, {
                                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                            lineNumber: 380,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, host.hostEmail, true, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 371,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 369,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 359,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 358,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 347,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-panel",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-panel-head",
                                children: /*#__PURE__*/ _jsxDEV("div", {
                                    children: [
                                        /*#__PURE__*/ _jsxDEV("span", {
                                            className: "admin-panel-chip",
                                            children: [
                                                /*#__PURE__*/ _jsxDEV(FiTrendingUp, {
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 397,
                                                    columnNumber: 17
                                                }, this),
                                                "Revenue trend"
                                            ]
                                        }, void 0, true, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 396,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ _jsxDEV("h2", {
                                            children: "Sales performance"
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 400,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 395,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 394,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-chart-wrap",
                                children: /*#__PURE__*/ _jsxDEV(ResponsiveContainer, {
                                    width: "100%",
                                    height: 280,
                                    children: /*#__PURE__*/ _jsxDEV(BarChart, {
                                        data: remoteSales && remoteSales.length ? remoteSales : salesData,
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(XAxis, {
                                                dataKey: "date"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 407,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV(YAxis, {}, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 408,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV(Tooltip, {
                                                formatter: (value)=>formatNaira(value)
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 409,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV(Bar, {
                                                dataKey: "total",
                                                fill: "#16a34a",
                                                radius: [
                                                    8,
                                                    8,
                                                    0,
                                                    0
                                                ]
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 410,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 406,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 405,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 404,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 393,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                lineNumber: 346,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV("section", {
                className: "admin-panel",
                children: [
                    /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-panel-head admin-panel-head-wrap",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                children: [
                                    /*#__PURE__*/ _jsxDEV("span", {
                                        className: "admin-panel-chip",
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(FiSearch, {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 421,
                                                columnNumber: 15
                                            }, this),
                                            "Ticket operations"
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 420,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV("h2", {
                                        children: "Ticket ledger"
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 424,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 419,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ _jsxDEV("div", {
                                className: "admin-toolbar",
                                children: [
                                    /*#__PURE__*/ _jsxDEV("label", {
                                        className: "admin-search",
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(FiSearch, {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 429,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("input", {
                                                type: "text",
                                                placeholder: "Search by event or email...",
                                                value: searchTerm,
                                                onChange: (event)=>{
                                                    setSearchTerm(event.target.value);
                                                    setCurrentPage(1);
                                                }
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 430,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 428,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV(CSVLink, {
                                        data: filteredTickets,
                                        filename: "tickets.csv",
                                        className: "admin-secondary-btn",
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(FiDownload, {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 441,
                                                columnNumber: 15
                                            }, this),
                                            "Export CSV"
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 440,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 427,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 418,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-table-wrap",
                        children: /*#__PURE__*/ _jsxDEV("table", {
                            className: "admin-table admin-table-stacked",
                            children: [
                                /*#__PURE__*/ _jsxDEV("thead", {
                                    children: /*#__PURE__*/ _jsxDEV("tr", {
                                        children: [
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Date"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 451,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Name"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 452,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Email"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 453,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Event"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 454,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Ticket Type"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 455,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Qty"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 456,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Host Earns"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 457,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Platform Earns"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 458,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Buyer Paid"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 459,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Transaction ID"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 460,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Resend Email"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 461,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 450,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 449,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ _jsxDEV("tbody", {
                                    children: paginatedTickets.map((ticket)=>/*#__PURE__*/ _jsxDEV("tr", {
                                            children: [
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Date",
                                                    children: ticket.date
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 467,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Name",
                                                    children: ticket.name
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 468,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Email",
                                                    children: ticket.email
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 469,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Event",
                                                    children: events.find((event)=>event.id === ticket.eventId)?.title || "N/A"
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 470,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Ticket Type",
                                                    children: ticket.ticketType
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 471,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Qty",
                                                    children: ticket.quantity
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 472,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Host Earns",
                                                    className: "admin-value admin-value-blue",
                                                    children: formatNaira(ticket.totalPaid || 0)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 473,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Platform Earns",
                                                    className: "admin-value admin-value-emerald",
                                                    children: formatNaira((ticket.hostFee || 0) + (ticket.serviceFee || 0))
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 476,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Buyer Paid",
                                                    className: "admin-value",
                                                    children: formatNaira(ticket.totalCharged || ticket.totalPaid || 0)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 479,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Transaction ID",
                                                    children: ticket.transactionId
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 482,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Resend Email",
                                                    children: /*#__PURE__*/ _jsxDEV("button", {
                                                        type: "button",
                                                        className: "admin-inline-btn admin-inline-btn-amber",
                                                        onClick: ()=>handleResendEmail(ticket),
                                                        disabled: resendingId === ticket.id,
                                                        children: [
                                                            /*#__PURE__*/ _jsxDEV(FiMail, {
                                                                "aria-hidden": "true"
                                                            }, void 0, false, {
                                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                                lineNumber: 490,
                                                                columnNumber: 23
                                                            }, this),
                                                            resendingId === ticket.id ? "Sending..." : "Resend"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 484,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 483,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, ticket.id, true, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 466,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 464,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                            lineNumber: 448,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 447,
                        columnNumber: 9
                    }, this),
                    totalPages > 1 ? /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-pagination",
                        children: Array.from({
                            length: totalPages
                        }, (_, index)=>index + 1).map((pageNumber)=>/*#__PURE__*/ _jsxDEV("button", {
                                type: "button",
                                className: `admin-page-btn ${currentPage === pageNumber ? "is-active" : ""}`,
                                onClick: ()=>setCurrentPage(pageNumber),
                                children: pageNumber
                            }, pageNumber, false, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 503,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 501,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                lineNumber: 417,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ _jsxDEV("section", {
                className: "admin-panel",
                children: [
                    /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-panel-head",
                        children: [
                            /*#__PURE__*/ _jsxDEV("div", {
                                children: [
                                    /*#__PURE__*/ _jsxDEV("span", {
                                        className: "admin-panel-chip",
                                        children: [
                                            /*#__PURE__*/ _jsxDEV(FiClock, {
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 520,
                                                columnNumber: 15
                                            }, this),
                                            "Withdrawal review"
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 519,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ _jsxDEV("h2", {
                                        children: "Withdrawal requests"
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 523,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 518,
                                columnNumber: 11
                            }, this),
                            pendingCount > 0 ? /*#__PURE__*/ _jsxDEV("span", {
                                className: "admin-alert-pill",
                                children: [
                                    pendingCount,
                                    " pending"
                                ]
                            }, void 0, true, {
                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                lineNumber: 526,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 517,
                        columnNumber: 9
                    }, this),
                    withdrawals.length === 0 ? /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-empty-state",
                        children: /*#__PURE__*/ _jsxDEV("p", {
                            children: "No withdrawal requests yet."
                        }, void 0, false, {
                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                            lineNumber: 532,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 531,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ _jsxDEV("div", {
                        className: "admin-table-wrap",
                        children: /*#__PURE__*/ _jsxDEV("table", {
                            className: "admin-table admin-table-stacked",
                            children: [
                                /*#__PURE__*/ _jsxDEV("thead", {
                                    children: /*#__PURE__*/ _jsxDEV("tr", {
                                        children: [
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Date"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 539,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Host"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 540,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Account Name"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 541,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Account No."
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 542,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Bank"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 543,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Amount"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 544,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Note"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 545,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Status"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 546,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ _jsxDEV("th", {
                                                children: "Actions"
                                            }, void 0, false, {
                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                lineNumber: 547,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 538,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 537,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ _jsxDEV("tbody", {
                                    children: withdrawals.map((withdrawal)=>/*#__PURE__*/ _jsxDEV("tr", {
                                            children: [
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Date",
                                                    children: withdrawal.timestamp ? new Date(withdrawal.timestamp).toLocaleDateString() : "N/A"
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 553,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Host",
                                                    children: withdrawal.hostEmail
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 556,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Account Name",
                                                    children: withdrawal.accountName
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 557,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Account No.",
                                                    children: withdrawal.accountNumber
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 558,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Bank",
                                                    children: withdrawal.bank
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 559,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Amount",
                                                    className: "admin-value admin-value-emerald",
                                                    children: formatNaira(withdrawal.amount)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 560,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Note",
                                                    children: withdrawal.note || "â"
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 563,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Status",
                                                    children: /*#__PURE__*/ _jsxDEV("span", {
                                                        className: getStatusBadgeClass(withdrawal.status),
                                                        children: withdrawal.status
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 565,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 564,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("td", {
                                                    "data-label": "Actions",
                                                    children: withdrawal.status === "pending" ? /*#__PURE__*/ _jsxDEV("div", {
                                                        className: "admin-action-row",
                                                        children: [
                                                            /*#__PURE__*/ _jsxDEV("button", {
                                                                type: "button",
                                                                className: "admin-inline-btn admin-inline-btn-approve",
                                                                onClick: ()=>handleWithdrawalStatus(withdrawal.id, "completed"),
                                                                children: "Approve"
                                                            }, void 0, false, {
                                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                                lineNumber: 570,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ _jsxDEV("button", {
                                                                type: "button",
                                                                className: "admin-inline-btn admin-inline-btn-reject",
                                                                onClick: ()=>handleWithdrawalStatus(withdrawal.id, "rejected"),
                                                                children: "Reject"
                                                            }, void 0, false, {
                                                                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                                lineNumber: 577,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 569,
                                                        columnNumber: 25
                                                    }, this) : /*#__PURE__*/ _jsxDEV("span", {
                                                        className: "admin-processed-note",
                                                        children: "Processed"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 586,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 567,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, withdrawal.id, true, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 552,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 550,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                            lineNumber: 536,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                        lineNumber: 535,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                lineNumber: 516,
                columnNumber: 7
            }, this),
            showEventList ? /*#__PURE__*/ _jsxDEV("div", {
                className: "admin-modal-backdrop",
                onClick: ()=>setShowEventList(false),
                children: /*#__PURE__*/ _jsxDEV("div", {
                    className: "admin-modal",
                    onClick: (event)=>event.stopPropagation(),
                    children: [
                        /*#__PURE__*/ _jsxDEV("div", {
                            className: "admin-modal-head",
                            children: [
                                /*#__PURE__*/ _jsxDEV("div", {
                                    children: [
                                        /*#__PURE__*/ _jsxDEV("span", {
                                            className: "admin-panel-chip",
                                            children: [
                                                /*#__PURE__*/ _jsxDEV(FiEye, {
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 603,
                                                    columnNumber: 19
                                                }, this),
                                                "Event index"
                                            ]
                                        }, void 0, true, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 602,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ _jsxDEV("h2", {
                                            children: "Current events"
                                        }, void 0, false, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 606,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 601,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ _jsxDEV("button", {
                                    type: "button",
                                    className: "admin-icon-btn",
                                    onClick: ()=>setShowEventList(false),
                                    "aria-label": "Close event list",
                                    children: /*#__PURE__*/ _jsxDEV(FiX, {
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                        lineNumber: 614,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 608,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                            lineNumber: 600,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ _jsxDEV("div", {
                            className: "admin-event-list",
                            children: events.map((event)=>/*#__PURE__*/ _jsxDEV("article", {
                                    className: "admin-event-item",
                                    children: [
                                        /*#__PURE__*/ _jsxDEV("div", {
                                            children: [
                                                /*#__PURE__*/ _jsxDEV("strong", {
                                                    children: event.title
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 622,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("span", {
                                                    children: event.date === "TBA" ? "Date TBA" : event.date || "No date set"
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 623,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 621,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ _jsxDEV("div", {
                                            className: "admin-event-actions",
                                            children: [
                                                /*#__PURE__*/ _jsxDEV("button", {
                                                    type: "button",
                                                    className: "admin-icon-btn",
                                                    onClick: ()=>navigate(`/event/edit/${event.id}`),
                                                    children: /*#__PURE__*/ _jsxDEV(FiEdit3, {
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 628,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 627,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ _jsxDEV("button", {
                                                    type: "button",
                                                    className: "admin-icon-btn admin-icon-btn-danger",
                                                    onClick: ()=>handleDeleteEvent(event.id),
                                                    children: /*#__PURE__*/ _jsxDEV(FiTrash2, {
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                        lineNumber: 631,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                                    lineNumber: 630,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                            lineNumber: 626,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, event.id, true, {
                                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                                    lineNumber: 620,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                            lineNumber: 618,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                    lineNumber: 599,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
                lineNumber: 598,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx",
        lineNumber: 261,
        columnNumber: 5
    }, this);
};
_s(AdminDashboard, "EXy4BmyGm3VzGqlNq5Xx/fijbEs=", false, function() {
    return [
        useNavigate,
        useSalesTrend
    ];
});
_c = AdminDashboard;
export default AdminDashboard;
var _c;
$RefreshReg$(_c, "AdminDashboard");


if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}


if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/HomePC/Documents/GitHub/nova-eko-events/src/pages/AdminDashboard.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkFkbWluRGFzaGJvYXJkLmpzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xyXG5pbXBvcnQgeyByZWYsIG9uVmFsdWUsIHJlbW92ZSwgdXBkYXRlLCBnZXQgfSBmcm9tIFwiZmlyZWJhc2UvZGF0YWJhc2VcIjtcclxuaW1wb3J0IHsgZGF0YWJhc2UsIGF1dGggfSBmcm9tIFwiLi4vZmlyZWJhc2UvZmlyZWJhc2VDb25maWdcIjtcclxuaW1wb3J0IHsgQ1NWTGluayB9IGZyb20gXCJyZWFjdC1jc3ZcIjtcclxuaW1wb3J0IHsgTGluaywgdXNlTmF2aWdhdGUgfSBmcm9tIFwicmVhY3Qtcm91dGVyLWRvbVwiO1xyXG5pbXBvcnQgZW1haWxqcyBmcm9tIFwiQGVtYWlsanMvYnJvd3NlclwiO1xyXG5pbXBvcnQgeyBCYXJDaGFydCwgQmFyLCBYQXhpcywgWUF4aXMsIFRvb2x0aXAsIFJlc3BvbnNpdmVDb250YWluZXIgfSBmcm9tIFwicmVjaGFydHNcIjtcclxuaW1wb3J0IHtcclxuICBGaUFjdGl2aXR5LFxyXG4gIEZpQ2FsZW5kYXIsXHJcbiAgRmlDaGVja0NpcmNsZSxcclxuICBGaUNsb2NrLFxyXG4gIEZpQ3JlZGl0Q2FyZCxcclxuICBGaURvbGxhclNpZ24sXHJcbiAgRmlEb3dubG9hZCxcclxuICBGaUVkaXQzLFxyXG4gIEZpRXllLFxyXG4gIEZpTWFpbCxcclxuICBGaVNlYXJjaCxcclxuICBGaVRyYXNoMixcclxuICBGaVRyZW5kaW5nVXAsXHJcbiAgRmlVc2VycyxcclxuICBGaVgsXHJcbn0gZnJvbSBcInJlYWN0LWljb25zL2ZpXCI7XHJcbmltcG9ydCBSZW1vdGVBZG1pbk92ZXJ2aWV3IGZyb20gXCIuLi9jb21wb25lbnRzL2NvbW1vbi9SZW1vdGVBZG1pbk92ZXJ2aWV3XCI7XHJcbmltcG9ydCBcIi4vYWRtaW4tZGFzaGJvYXJkLXRyb29wLmNzc1wiO1xyXG5pbXBvcnQgeyB1c2VTYWxlc1RyZW5kIH0gZnJvbSAnLi4vaG9va3MvdXNlU2FsZXNUcmVuZCc7XHJcblxyXG5jb25zdCBFTUFJTEpTX1NFUlZJQ0VfSUQgPSBpbXBvcnQubWV0YS5lbnYuVklURV9FTUFJTEpTX1NFUlZJQ0VfSUQgfHwgXCJcIjtcclxuY29uc3QgRU1BSUxKU19URU1QTEFURV9JRCA9IGltcG9ydC5tZXRhLmVudi5WSVRFX0VNQUlMSlNfVEVNUExBVEVfSUQgfHwgXCJcIjtcclxuY29uc3QgRU1BSUxKU19QVUJMSUNfS0VZID0gaW1wb3J0Lm1ldGEuZW52LlZJVEVfRU1BSUxKU19QVUJMSUNfS0VZIHx8IFwiXCI7XHJcblxyXG5jb25zdCBmb3JtYXROYWlyYSA9ICh2YWx1ZSkgPT4gYE5HTiAke051bWJlcih2YWx1ZSB8fCAwKS50b0xvY2FsZVN0cmluZygpfWA7XHJcblxyXG5jb25zdCBBZG1pbkRhc2hib2FyZCA9ICgpID0+IHtcclxuICBjb25zdCBbZXZlbnRzLCBzZXRFdmVudHNdID0gdXNlU3RhdGUoW10pO1xyXG4gIGNvbnN0IFt0aWNrZXRzLCBzZXRUaWNrZXRzXSA9IHVzZVN0YXRlKFtdKTtcclxuICBjb25zdCBbd2l0aGRyYXdhbHMsIHNldFdpdGhkcmF3YWxzXSA9IHVzZVN0YXRlKFtdKTtcclxuICBjb25zdCBbc2hvd0V2ZW50TGlzdCwgc2V0U2hvd0V2ZW50TGlzdF0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgbmF2aWdhdGUgPSB1c2VOYXZpZ2F0ZSgpO1xyXG4gIGNvbnN0IFtzZWFyY2hUZXJtLCBzZXRTZWFyY2hUZXJtXSA9IHVzZVN0YXRlKFwiXCIpO1xyXG4gIGNvbnN0IFtjdXJyZW50UGFnZSwgc2V0Q3VycmVudFBhZ2VdID0gdXNlU3RhdGUoMSk7XHJcbiAgY29uc3QgW3Jlc2VuZGluZ0lkLCBzZXRSZXNlbmRpbmdJZF0gPSB1c2VTdGF0ZShudWxsKTtcclxuICBjb25zdCBpdGVtc1BlclBhZ2UgPSAxMDtcclxuXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IGV2ZW50c1JlZiA9IHJlZihkYXRhYmFzZSwgXCJldmVudHNcIik7XHJcbiAgICBvblZhbHVlKGV2ZW50c1JlZiwgKHNuYXBzaG90KSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBzbmFwc2hvdC52YWwoKSB8fCB7fTtcclxuICAgICAgc2V0RXZlbnRzKE9iamVjdC5lbnRyaWVzKGRhdGEpLm1hcCgoW2lkLCB2YWx1ZV0pID0+ICh7IGlkLCAuLi52YWx1ZSB9KSkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdGlja2V0c1JlZiA9IHJlZihkYXRhYmFzZSwgXCJ0aWNrZXRzXCIpO1xyXG4gICAgb25WYWx1ZSh0aWNrZXRzUmVmLCAoc25hcHNob3QpID0+IHtcclxuICAgICAgY29uc3QgZGF0YSA9IHNuYXBzaG90LnZhbCgpIHx8IHt9O1xyXG4gICAgICBzZXRUaWNrZXRzKFxyXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGRhdGEpLm1hcCgoW2lkLCB2YWx1ZV0pID0+ICh7XHJcbiAgICAgICAgICBpZCxcclxuICAgICAgICAgIC4uLnZhbHVlLFxyXG4gICAgICAgICAgZGF0ZTogdmFsdWUudGltZXN0YW1wID8gbmV3IERhdGUodmFsdWUudGltZXN0YW1wKS50b0xvY2FsZURhdGVTdHJpbmcoKSA6IFwiTi9BXCIsXHJcbiAgICAgICAgfSkpXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCB3aXRoZHJhd2Fsc1JlZiA9IHJlZihkYXRhYmFzZSwgXCJ3aXRoZHJhd2FsUmVxdWVzdHNcIik7XHJcbiAgICBvblZhbHVlKHdpdGhkcmF3YWxzUmVmLCAoc25hcHNob3QpID0+IHtcclxuICAgICAgY29uc3QgZGF0YSA9IHNuYXBzaG90LnZhbCgpIHx8IHt9O1xyXG4gICAgICBjb25zdCByZXF1ZXN0c0FycmF5ID0gT2JqZWN0LmVudHJpZXMoZGF0YSlcclxuICAgICAgICAubWFwKChbaWQsIHZhbHVlXSkgPT4gKHsgaWQsIC4uLnZhbHVlIH0pKVxyXG4gICAgICAgIC5zb3J0KChsZWZ0LCByaWdodCkgPT4gKHJpZ2h0LnRpbWVzdGFtcCB8fCAwKSAtIChsZWZ0LnRpbWVzdGFtcCB8fCAwKSk7XHJcbiAgICAgIHNldFdpdGhkcmF3YWxzKHJlcXVlc3RzQXJyYXkpO1xyXG4gICAgfSk7XHJcbiAgfSwgW10pO1xyXG5cclxuICBjb25zdCB0b3RhbEV2ZW50cyA9IGV2ZW50cy5sZW5ndGg7XHJcbiAgY29uc3QgdG90YWxUaWNrZXRzU29sZCA9IHRpY2tldHMucmVkdWNlKChzdW0sIHRpY2tldCkgPT4gc3VtICsgKHRpY2tldC5xdWFudGl0eSB8fCAxKSwgMCk7XHJcbiAgY29uc3QgdG90YWxSZXZlbnVlID0gdGlja2V0cy5yZWR1Y2UoKHN1bSwgdGlja2V0KSA9PiBzdW0gKyAodGlja2V0LnRvdGFsQ2hhcmdlZCB8fCB0aWNrZXQudG90YWxQYWlkIHx8IDApLCAwKTtcclxuICBjb25zdCBwbGF0Zm9ybVJldmVudWUgPSB0aWNrZXRzLnJlZHVjZShcclxuICAgIChzdW0sIHRpY2tldCkgPT4gc3VtICsgKCh0aWNrZXQuaG9zdEZlZSB8fCAwKSArICh0aWNrZXQuc2VydmljZUZlZSB8fCAwKSksXHJcbiAgICAwXHJcbiAgKTtcclxuICBjb25zdCB0b3RhbEF0dGVuZGVlcyA9IG5ldyBTZXQodGlja2V0cy5tYXAoKHRpY2tldCkgPT4gdGlja2V0LmVtYWlsKSkuc2l6ZTtcclxuICBjb25zdCB0b3RhbFBhaWRPdXQgPSB3aXRoZHJhd2Fsc1xyXG4gICAgLmZpbHRlcigod2l0aGRyYXdhbCkgPT4gd2l0aGRyYXdhbC5zdGF0dXMgPT09IFwiY29tcGxldGVkXCIpXHJcbiAgICAucmVkdWNlKChzdW0sIHdpdGhkcmF3YWwpID0+IHN1bSArICh3aXRoZHJhd2FsLmFtb3VudCB8fCAwKSwgMCk7XHJcbiAgY29uc3QgcGVuZGluZ0NvdW50ID0gd2l0aGRyYXdhbHMuZmlsdGVyKCh3aXRoZHJhd2FsKSA9PiB3aXRoZHJhd2FsLnN0YXR1cyA9PT0gXCJwZW5kaW5nXCIpLmxlbmd0aDtcclxuXHJcbiAgY29uc3QgaG9zdEJyZWFrZG93biA9IHVzZU1lbW8oKCkgPT4ge1xyXG4gICAgY29uc3QgYnJlYWtkb3duID0gdGlja2V0cy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCB0aWNrZXQpID0+IHtcclxuICAgICAgY29uc3QgaG9zdEVtYWlsID0gdGlja2V0Lmhvc3RFbWFpbCB8fCBcIlVua25vd25cIjtcclxuXHJcbiAgICAgIGlmICghYWNjdW11bGF0b3JbaG9zdEVtYWlsXSkge1xyXG4gICAgICAgIGFjY3VtdWxhdG9yW2hvc3RFbWFpbF0gPSB7XHJcbiAgICAgICAgICBob3N0RW1haWwsXHJcbiAgICAgICAgICB0b3RhbEVhcm5lZDogMCxcclxuICAgICAgICAgIHRpY2tldHM6IDAsXHJcbiAgICAgICAgICB3aXRoZHJhd246IDAsXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYWNjdW11bGF0b3JbaG9zdEVtYWlsXS50b3RhbEVhcm5lZCArPSB0aWNrZXQudG90YWxQYWlkIHx8IDA7XHJcbiAgICAgIGFjY3VtdWxhdG9yW2hvc3RFbWFpbF0udGlja2V0cyArPSB0aWNrZXQucXVhbnRpdHkgfHwgMTtcclxuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xyXG4gICAgfSwge30pO1xyXG5cclxuICAgIHdpdGhkcmF3YWxzXHJcbiAgICAgIC5maWx0ZXIoKHdpdGhkcmF3YWwpID0+IHdpdGhkcmF3YWwuc3RhdHVzID09PSBcImNvbXBsZXRlZFwiKVxyXG4gICAgICAuZm9yRWFjaCgod2l0aGRyYXdhbCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGhvc3RFbWFpbCA9IHdpdGhkcmF3YWwuaG9zdEVtYWlsO1xyXG4gICAgICAgIGlmIChicmVha2Rvd25baG9zdEVtYWlsXSkge1xyXG4gICAgICAgICAgYnJlYWtkb3duW2hvc3RFbWFpbF0ud2l0aGRyYXduICs9IHdpdGhkcmF3YWwuYW1vdW50IHx8IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhicmVha2Rvd24pXHJcbiAgICAgIC5tYXAoKGhvc3QpID0+ICh7XHJcbiAgICAgICAgLi4uaG9zdCxcclxuICAgICAgICBzdGlsbE93ZWQ6IE1hdGgubWF4KDAsIGhvc3QudG90YWxFYXJuZWQgLSBob3N0LndpdGhkcmF3biksXHJcbiAgICAgIH0pKVxyXG4gICAgICAuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnRvdGFsRWFybmVkIC0gbGVmdC50b3RhbEVhcm5lZCk7XHJcbiAgfSwgW3RpY2tldHMsIHdpdGhkcmF3YWxzXSk7XHJcblxyXG4gIGNvbnN0IHRvdGFsT3dlZFRvSG9zdHMgPSBob3N0QnJlYWtkb3duLnJlZHVjZSgoc3VtLCBob3N0KSA9PiBzdW0gKyBob3N0LnN0aWxsT3dlZCwgMCk7XHJcblxyXG4gIGNvbnN0IHNhbGVzRGF0YSA9IE9iamVjdC52YWx1ZXMoXHJcbiAgICB0aWNrZXRzLnJlZHVjZSgoYWNjdW11bGF0b3IsIHRpY2tldCkgPT4ge1xyXG4gICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodGlja2V0LnRpbWVzdGFtcCB8fCBEYXRlLm5vdygpKS50b0xvY2FsZURhdGVTdHJpbmcoKTtcclxuICAgICAgYWNjdW11bGF0b3JbZGF0ZV0gPSBhY2N1bXVsYXRvcltkYXRlXSB8fCB7IGRhdGUsIHRvdGFsOiAwIH07XHJcbiAgICAgIGFjY3VtdWxhdG9yW2RhdGVdLnRvdGFsICs9IHRpY2tldC50b3RhbFBhaWQgfHwgMDtcclxuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xyXG4gICAgfSwge30pXHJcbiAgKTtcclxuXHJcbiAgLy8gcmVtb3RlIHNhbGVzIHRyZW5kIChmcm9tIHNlcnZlciBhZ2dyZWdhdGVzKVxyXG4gIGNvbnN0IHsgZGF0YTogcmVtb3RlU2FsZXMsIGlzTG9hZGluZzogcmVtb3RlU2FsZXNMb2FkaW5nIH0gPSB1c2VTYWxlc1RyZW5kKDMwKTtcclxuXHJcbiAgY29uc3QgZmlsdGVyZWRUaWNrZXRzID0gdGlja2V0c1xyXG4gICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiAocmlnaHQudGltZXN0YW1wIHx8IDApIC0gKGxlZnQudGltZXN0YW1wIHx8IDApKVxyXG4gICAgLmZpbHRlcigodGlja2V0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGV2ZW50RXhpc3RzID0gZXZlbnRzLnNvbWUoKGV2ZW50KSA9PiBldmVudC5pZCA9PT0gdGlja2V0LmV2ZW50SWQpO1xyXG4gICAgICBjb25zdCBtYXRjaGluZ0V2ZW50VGl0bGUgPSBldmVudHMuZmluZCgoZXZlbnQpID0+IGV2ZW50LmlkID09PSB0aWNrZXQuZXZlbnRJZCk/LnRpdGxlIHx8IFwiXCI7XHJcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTZWFyY2ggPSBzZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICBjb25zdCBtYXRjaGVzU2VhcmNoID1cclxuICAgICAgICB0aWNrZXQuZW1haWw/LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobm9ybWFsaXplZFNlYXJjaCkgfHxcclxuICAgICAgICBtYXRjaGluZ0V2ZW50VGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhub3JtYWxpemVkU2VhcmNoKTtcclxuXHJcbiAgICAgIHJldHVybiBldmVudEV4aXN0cyAmJiBtYXRjaGVzU2VhcmNoO1xyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHBhZ2luYXRlZFRpY2tldHMgPSBmaWx0ZXJlZFRpY2tldHMuc2xpY2UoXHJcbiAgICAoY3VycmVudFBhZ2UgLSAxKSAqIGl0ZW1zUGVyUGFnZSxcclxuICAgIGN1cnJlbnRQYWdlICogaXRlbXNQZXJQYWdlXHJcbiAgKTtcclxuICBjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5jZWlsKGZpbHRlcmVkVGlja2V0cy5sZW5ndGggLyBpdGVtc1BlclBhZ2UpO1xyXG5cclxuICBjb25zdCBzZW5kQXVkaXQgPSBhc3luYyAoYWN0aW9uLCBkZXRhaWxzKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAoIWF1dGggfHwgIWF1dGguY3VycmVudFVzZXIpIHJldHVybjtcclxuICAgICAgY29uc3QgdG9rZW4gPSBhd2FpdCBhdXRoLmN1cnJlbnRVc2VyLmdldElkVG9rZW4odHJ1ZSk7XHJcbiAgICAgIGF3YWl0IGZldGNoKCcvYWRtaW4vYXVkaXQnLCB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0b2tlbn1gLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb24sIGRldGFpbHMgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIHNlbmQgYXVkaXQgbG9nJywgZXJyKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBoYW5kbGVEZWxldGVFdmVudCA9IGFzeW5jIChldmVudElkKSA9PiB7XHJcbiAgICBpZiAod2luZG93LmNvbmZpcm0oXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgZXZlbnQgYW5kIGFsbCBpdHMgdGlja2V0cz9cIikpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB0aWNrZXRzUmVmID0gcmVmKGRhdGFiYXNlLCBcInRpY2tldHNcIik7XHJcbiAgICAgICAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCBnZXQodGlja2V0c1JlZik7XHJcblxyXG4gICAgICAgIGlmIChzbmFwc2hvdC5leGlzdHMoKSkge1xyXG4gICAgICAgICAgY29uc3QgdGlja2V0c0RhdGEgPSBzbmFwc2hvdC52YWwoKTtcclxuICAgICAgICAgIGNvbnN0IGRlbGV0ZVByb21pc2VzID0gT2JqZWN0LmVudHJpZXModGlja2V0c0RhdGEpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoKFssIHRpY2tldF0pID0+IHRpY2tldC5ldmVudElkID09PSBldmVudElkKVxyXG4gICAgICAgICAgICAubWFwKChbdGlja2V0SWRdKSA9PiByZW1vdmUocmVmKGRhdGFiYXNlLCBgdGlja2V0cy8ke3RpY2tldElkfWApKSk7XHJcbiAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChkZWxldGVQcm9taXNlcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCByZW1vdmUocmVmKGRhdGFiYXNlLCBgZXZlbnRzLyR7ZXZlbnRJZH1gKSk7XHJcbiAgICAgICAgLy8gYXVkaXRcclxuICAgICAgICBzZW5kQXVkaXQoJ2RlbGV0ZV9ldmVudCcsIHsgZXZlbnRJZCB9KTtcclxuICAgICAgICBhbGVydChcIkV2ZW50IGFuZCBhbGwgaXRzIHRpY2tldHMgZGVsZXRlZCBzdWNjZXNzZnVsbHkuXCIpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGFsZXJ0KGBFcnJvciBkZWxldGluZyBldmVudDogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaGFuZGxlV2l0aGRyYXdhbFN0YXR1cyA9IGFzeW5jIChpZCwgc3RhdHVzKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB1cGRhdGUocmVmKGRhdGFiYXNlLCBgd2l0aGRyYXdhbFJlcXVlc3RzLyR7aWR9YCksIHsgc3RhdHVzIH0pO1xyXG4gICAgICAvLyBhdWRpdFxyXG4gICAgICBzZW5kQXVkaXQoJ3dpdGhkcmF3YWxfdXBkYXRlJywgeyBpZCwgc3RhdHVzIH0pO1xyXG4gICAgICBhbGVydChgUmVxdWVzdCBtYXJrZWQgYXMgJHtzdGF0dXN9LmApO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgYWxlcnQoYEZhaWxlZCB0byB1cGRhdGUgc3RhdHVzOiAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgaGFuZGxlUmVzZW5kRW1haWwgPSBhc3luYyAodGlja2V0KSA9PiB7XHJcbiAgICBpZiAoIXRpY2tldC5lbWFpbCkge1xyXG4gICAgICBhbGVydChcIk5vIGVtYWlsIGFkZHJlc3MgZm91bmQgZm9yIHRoaXMgdGlja2V0LlwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFJlc2VuZGluZ0lkKHRpY2tldC5pZCk7XHJcbiAgICBjb25zdCBldmVudCA9IGV2ZW50cy5maW5kKChjdXJyZW50RXZlbnQpID0+IGN1cnJlbnRFdmVudC5pZCA9PT0gdGlja2V0LmV2ZW50SWQpO1xyXG4gICAgY29uc3QgdGlja2V0UHJpY2UgPSB0aWNrZXQudG90YWxQYWlkIHx8IDA7XHJcbiAgICBjb25zdCB0b3RhbFBhaWQgPSB0aWNrZXQudG90YWxDaGFyZ2VkIHx8IHRpY2tldC50b3RhbFBhaWQgfHwgMDtcclxuXHJcbiAgICBpZiAoRU1BSUxKU19TRVJWSUNFX0lEICYmIEVNQUlMSlNfVEVNUExBVEVfSUQgJiYgRU1BSUxKU19QVUJMSUNfS0VZKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZW1haWxqcy5zZW5kKFxyXG4gICAgICAgICAgRU1BSUxKU19TRVJWSUNFX0lELFxyXG4gICAgICAgICAgRU1BSUxKU19URU1QTEFURV9JRCxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdG9fZW1haWw6IHRpY2tldC5lbWFpbCxcclxuICAgICAgICAgICAgdXNlcl9uYW1lOiB0aWNrZXQubmFtZSB8fCB0aWNrZXQuZW1haWwsXHJcbiAgICAgICAgICAgIGV2ZW50X25hbWU6IHRpY2tldC5ldmVudFRpdGxlIHx8IGV2ZW50Py50aXRsZSB8fCBcIllvdXIgRXZlbnRcIixcclxuICAgICAgICAgICAgZXZlbnRfZGF0ZTogZXZlbnQ/LmRhdGUgfHwgXCJcIixcclxuICAgICAgICAgICAgZXZlbnRfbG9jYXRpb246IGV2ZW50Py5sb2NhdGlvbiB8fCBcIlwiLFxyXG4gICAgICAgICAgICB0aWNrZXRfdHlwZTogdGlja2V0LnRpY2tldFR5cGUgfHwgXCJcIixcclxuICAgICAgICAgICAgcXVhbnRpdHk6IFN0cmluZyh0aWNrZXQucXVhbnRpdHkgfHwgMSksXHJcbiAgICAgICAgICAgIHVuaXRfcHJpY2U6IHRpY2tldFByaWNlLnRvTG9jYWxlU3RyaW5nKCksXHJcbiAgICAgICAgICAgIHRvdGFsX3BhaWQ6IHRvdGFsUGFpZC50b0xvY2FsZVN0cmluZygpLFxyXG4gICAgICAgICAgICBvcmRlcl9pZDogdGlja2V0LnRyYW5zYWN0aW9uSWQgfHwgdGlja2V0LmlkLFxyXG4gICAgICAgICAgICBxcl9jb2RlX3VybDogYGh0dHBzOi8vYXBpLnFyc2VydmVyLmNvbS92MS9jcmVhdGUtcXItY29kZS8/c2l6ZT0yMDB4MjAwJmRhdGE9JHtlbmNvZGVVUklDb21wb25lbnQodGlja2V0LnRyYW5zYWN0aW9uSWQgfHwgdGlja2V0LmlkKX1gLFxyXG4gICAgICAgICAgICBzdXBwb3J0X2VtYWlsOiBcIkVrb3RpeDIzNEBnbWFpbC5jb21cIixcclxuICAgICAgICAgICAgY29tcGFueV9uYW1lOiBcIkVrb3RpeFwiLFxyXG4gICAgICAgICAgICBjdXJyZW50X3llYXI6IFN0cmluZyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIEVNQUlMSlNfUFVCTElDX0tFWVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgLy8gYXVkaXRcclxuICAgICAgICBzZW5kQXVkaXQoJ3Jlc2VuZF90aWNrZXRfZW1haWwnLCB7IHRpY2tldElkOiB0aWNrZXQuaWQsIHRvOiB0aWNrZXQuZW1haWwgfSk7XHJcbiAgICAgICAgYWxlcnQoYEVtYWlsIHJlc2VudCBzdWNjZXNzZnVsbHkgdG8gJHt0aWNrZXQuZW1haWx9YCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVtYWlsSlMgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICBhbGVydChgRmFpbGVkIHRvIHJlc2VuZCBlbWFpbDogJHtlcnJvci50ZXh0IHx8IGVycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcIkVtYWlsSlMgaXMgbm90IGNvbmZpZ3VyZWQuIFNraXBwaW5nIHJlc2VuZCBlbWFpbC5cIik7XHJcbiAgICAgIGFsZXJ0KFwiVGlja2V0IGVtYWlsIHdhcyBub3QgcmVzZW50IGJlY2F1c2UgRW1haWxKUyBpcyBub3QgY29uZmlndXJlZC5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0UmVzZW5kaW5nSWQobnVsbCk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZ2V0U3RhdHVzQmFkZ2VDbGFzcyA9IChzdGF0dXMpID0+IGBhZG1pbi1zdGF0dXMgYWRtaW4tc3RhdHVzLSR7c3RhdHVzIHx8IFwicGVuZGluZ1wifWA7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLWRhc2hib2FyZFwiPlxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJhZG1pbi1oZXJvXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1oZXJvLWNvcHlcIj5cclxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFkbWluLWtpY2tlclwiPk9wZXJhdGlvbnMgY2VudGVyPC9zcGFuPlxyXG4gICAgICAgICAgPGgxPlJ1biBFa290aXggd2l0aCBjbGFyaXR5PC9oMT5cclxuICAgICAgICAgIDxwPlxyXG4gICAgICAgICAgICBPdmVyc2VlIHBsYXRmb3JtIHJldmVudWUsIHRyYWNrIGV2ZW50IHBlcmZvcm1hbmNlLCByZXZpZXcgd2l0aGRyYXdhbHMsIGFuZCBtYW5hZ2UgdGlja2V0IGFjdGl2aXR5IGZyb20gb25lIHByZW1pdW0gY29udHJvbCByb29tLlxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1oZXJvLWFjdGlvbnNcIj5cclxuICAgICAgICAgICAgPExpbmsgdG89XCIvZXZlbnQvbmV3XCIgY2xhc3NOYW1lPVwiYWRtaW4tcHJpbWFyeS1idG4gYnV0dG9uLXByaW1hcnlcIj5cclxuICAgICAgICAgICAgICA8RmlDYWxlbmRhciBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgIENyZWF0ZSBOZXcgRXZlbnRcclxuICAgICAgICAgICAgPC9MaW5rPlxyXG4gICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWRtaW4tc2Vjb25kYXJ5LWJ0blwiXHJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0V2ZW50TGlzdCh0cnVlKX1cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIDxGaUV5ZSBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgIFZpZXcgRXZlbnQgSW5kZXhcclxuICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxDU1ZMaW5rIGRhdGE9e2ZpbHRlcmVkVGlja2V0c30gZmlsZW5hbWU9XCJ0aWNrZXRzLmNzdlwiIGNsYXNzTmFtZT1cImFkbWluLXNlY29uZGFyeS1idG5cIj5cclxuICAgICAgICAgICAgICA8RmlEb3dubG9hZCBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgIEV4cG9ydCBUaWNrZXRzXHJcbiAgICAgICAgICAgIDwvQ1NWTGluaz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLWhlcm8tYXNpZGVcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4taGVyby1zdGF0XCI+XHJcbiAgICAgICAgICAgIDxzcGFuPkxpdmUgZXZlbnRzPC9zcGFuPlxyXG4gICAgICAgICAgICA8c3Ryb25nPnt0b3RhbEV2ZW50c308L3N0cm9uZz5cclxuICAgICAgICAgICAgPHNtYWxsPkFsbCBhY3RpdmUgYW5kIGFyY2hpdmVkIGV2ZW50IHJlY29yZHM8L3NtYWxsPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLWhlcm8tc3RhdFwiPlxyXG4gICAgICAgICAgICA8c3Bhbj5QZW5kaW5nIHdpdGhkcmF3YWxzPC9zcGFuPlxyXG4gICAgICAgICAgICA8c3Ryb25nPntwZW5kaW5nQ291bnR9PC9zdHJvbmc+XHJcbiAgICAgICAgICAgIDxzbWFsbD5SZXF1ZXN0cyBuZWVkaW5nIGZpbmFuY2UgcmV2aWV3PC9zbWFsbD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7LyogUmVtb3RlIGFkbWluIG92ZXJ2aWV3IChzZWN1cmUpICovfVxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJhZG1pbi1rcGktZ3JpZFwiPlxyXG4gICAgICAgIDxkaXYgc3R5bGU9e3sgd2lkdGg6ICcxMDAlJyB9fT5cclxuICAgICAgICAgIHsvKiBSZW1vdGVBZG1pbk92ZXJ2aWV3IGZldGNoZXMgc2VjdXJlIHNlcnZlciBhZ2dyZWdhdGVzIHZpYSBSZWFjdCBRdWVyeSAqL31cclxuICAgICAgICAgIDxSZW1vdGVBZG1pbk92ZXJ2aWV3IC8+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cImFkbWluLWZpbmFuY2UtZ3JpZFwiPlxyXG4gICAgICAgIDxhcnRpY2xlIGNsYXNzTmFtZT1cImFkbWluLWZpbmFuY2UtY2FyZCBhZG1pbi1maW5hbmNlLWNhcmQtZW1lcmFsZFwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1maW5hbmNlLWhlYWRcIj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWRtaW4tcGFuZWwtY2hpcFwiPlxyXG4gICAgICAgICAgICAgIDxGaVRyZW5kaW5nVXAgYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cclxuICAgICAgICAgICAgICBQbGF0Zm9ybSByZXZlbnVlXHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPHN0cm9uZz57Zm9ybWF0TmFpcmEocGxhdGZvcm1SZXZlbnVlKX08L3N0cm9uZz5cclxuICAgICAgICAgIDxwPjUlIGhvc3QgZmVlIHBsdXMgTkdOIDEwMCBzZXJ2aWNlIGZlZSBwZXIgdGlja2V0LjwvcD5cclxuICAgICAgICA8L2FydGljbGU+XHJcblxyXG4gICAgICAgIDxhcnRpY2xlIGNsYXNzTmFtZT1cImFkbWluLWZpbmFuY2UtY2FyZCBhZG1pbi1maW5hbmNlLWNhcmQtYW1iZXJcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4tZmluYW5jZS1oZWFkXCI+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFkbWluLXBhbmVsLWNoaXBcIj5cclxuICAgICAgICAgICAgICA8RmlDaGVja0NpcmNsZSBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgIFRvdGFsIHBhaWQgb3V0XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPHN0cm9uZz57Zm9ybWF0TmFpcmEodG90YWxQYWlkT3V0KX08L3N0cm9uZz5cclxuICAgICAgICAgIDxwPkNvbXBsZXRlZCB3aXRoZHJhd2FscyBhbHJlYWR5IHByb2Nlc3NlZCB0byBob3N0cy48L3A+XHJcbiAgICAgICAgPC9hcnRpY2xlPlxyXG5cclxuICAgICAgICA8YXJ0aWNsZSBjbGFzc05hbWU9XCJhZG1pbi1maW5hbmNlLWNhcmQgYWRtaW4tZmluYW5jZS1jYXJkLWJsdWVcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4tZmluYW5jZS1oZWFkXCI+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFkbWluLXBhbmVsLWNoaXBcIj5cclxuICAgICAgICAgICAgICA8RmlBY3Rpdml0eSBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgIFN0aWxsIG93ZWQgdG8gaG9zdHNcclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8c3Ryb25nPntmb3JtYXROYWlyYSh0b3RhbE93ZWRUb0hvc3RzKX08L3N0cm9uZz5cclxuICAgICAgICAgIDxwPlRvdGFsIGhvc3QgZWFybmluZ3MgcmVtYWluaW5nIGFmdGVyIHNldHRsZWQgcGF5b3V0cy48L3A+XHJcbiAgICAgICAgPC9hcnRpY2xlPlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJhZG1pbi1tYWluLWdyaWRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLXBhbmVsXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLXBhbmVsLWhlYWRcIj5cclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhZG1pbi1wYW5lbC1jaGlwXCI+XHJcbiAgICAgICAgICAgICAgICA8RmlVc2VycyBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgSG9zdCBvdmVydmlld1xyXG4gICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICA8aDI+UGVyIGhvc3QgcGF5b3V0IGJyZWFrZG93bjwvaDI+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi10YWJsZS13cmFwXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJhZG1pbi10YWJsZSBhZG1pbi10YWJsZS1zdGFja2VkXCI+XHJcbiAgICAgICAgICAgICAgPHRoZWFkPlxyXG4gICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICA8dGg+SG9zdCBFbWFpbDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aD5UaWNrZXRzIFNvbGQ8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGg+VG90YWwgRWFybmVkPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoPlRvdGFsIFdpdGhkcmF3bjwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aD5TdGlsbCBPd2VkPC90aD5cclxuICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgICB7aG9zdEJyZWFrZG93bi5tYXAoKGhvc3QpID0+IChcclxuICAgICAgICAgICAgICAgICAgPHRyIGtleT17aG9zdC5ob3N0RW1haWx9PlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiSG9zdCBFbWFpbFwiPntob3N0Lmhvc3RFbWFpbH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiVGlja2V0cyBTb2xkXCI+e2hvc3QudGlja2V0c308L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiVG90YWwgRWFybmVkXCIgY2xhc3NOYW1lPVwiYWRtaW4tdmFsdWUgYWRtaW4tdmFsdWUtZW1lcmFsZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdE5haXJhKGhvc3QudG90YWxFYXJuZWQpfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWw9XCJUb3RhbCBXaXRoZHJhd25cIiBjbGFzc05hbWU9XCJhZG1pbi12YWx1ZSBhZG1pbi12YWx1ZS1hbWJlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdE5haXJhKGhvc3Qud2l0aGRyYXduKX1cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZFxyXG4gICAgICAgICAgICAgICAgICAgICAgZGF0YS1sYWJlbD1cIlN0aWxsIE93ZWRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgYWRtaW4tdmFsdWUgJHtob3N0LnN0aWxsT3dlZCA+IDAgPyBcImFkbWluLXZhbHVlLWJsdWVcIiA6IFwiYWRtaW4tdmFsdWUtbXV0ZWRcIn1gfVxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXROYWlyYShob3N0LnN0aWxsT3dlZCl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1wYW5lbFwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1wYW5lbC1oZWFkXCI+XHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWRtaW4tcGFuZWwtY2hpcFwiPlxyXG4gICAgICAgICAgICAgICAgPEZpVHJlbmRpbmdVcCBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgUmV2ZW51ZSB0cmVuZFxyXG4gICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICA8aDI+U2FsZXMgcGVyZm9ybWFuY2U8L2gyPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4tY2hhcnQtd3JhcFwiPlxyXG4gICAgICAgICAgICA8UmVzcG9uc2l2ZUNvbnRhaW5lciB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9ezI4MH0+XHJcbiAgICAgICAgICAgICAgPEJhckNoYXJ0IGRhdGE9e3JlbW90ZVNhbGVzICYmIHJlbW90ZVNhbGVzLmxlbmd0aCA/IHJlbW90ZVNhbGVzIDogc2FsZXNEYXRhfT5cclxuICAgICAgICAgICAgICAgIDxYQXhpcyBkYXRhS2V5PVwiZGF0ZVwiIC8+XHJcbiAgICAgICAgICAgICAgICA8WUF4aXMgLz5cclxuICAgICAgICAgICAgICAgIDxUb29sdGlwIGZvcm1hdHRlcj17KHZhbHVlKSA9PiBmb3JtYXROYWlyYSh2YWx1ZSl9IC8+XHJcbiAgICAgICAgICAgICAgICA8QmFyIGRhdGFLZXk9XCJ0b3RhbFwiIGZpbGw9XCIjMTZhMzRhXCIgcmFkaXVzPXtbOCwgOCwgMCwgMF19IC8+XHJcbiAgICAgICAgICAgICAgPC9CYXJDaGFydD5cclxuICAgICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cImFkbWluLXBhbmVsXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1wYW5lbC1oZWFkIGFkbWluLXBhbmVsLWhlYWQtd3JhcFwiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWRtaW4tcGFuZWwtY2hpcFwiPlxyXG4gICAgICAgICAgICAgIDxGaVNlYXJjaCBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgIFRpY2tldCBvcGVyYXRpb25zXHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPGgyPlRpY2tldCBsZWRnZXI8L2gyPlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi10b29sYmFyXCI+XHJcbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJhZG1pbi1zZWFyY2hcIj5cclxuICAgICAgICAgICAgICA8RmlTZWFyY2ggYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cclxuICAgICAgICAgICAgICA8aW5wdXRcclxuICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcclxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIGJ5IGV2ZW50IG9yIGVtYWlsLi4uXCJcclxuICAgICAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hUZXJtfVxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBzZXRTZWFyY2hUZXJtKGV2ZW50LnRhcmdldC52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgIHNldEN1cnJlbnRQYWdlKDEpO1xyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICA8L2xhYmVsPlxyXG4gICAgICAgICAgICA8Q1NWTGluayBkYXRhPXtmaWx0ZXJlZFRpY2tldHN9IGZpbGVuYW1lPVwidGlja2V0cy5jc3ZcIiBjbGFzc05hbWU9XCJhZG1pbi1zZWNvbmRhcnktYnRuXCI+XHJcbiAgICAgICAgICAgICAgPEZpRG93bmxvYWQgYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cclxuICAgICAgICAgICAgICBFeHBvcnQgQ1NWXHJcbiAgICAgICAgICAgIDwvQ1NWTGluaz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLXRhYmxlLXdyYXBcIj5cclxuICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJhZG1pbi10YWJsZSBhZG1pbi10YWJsZS1zdGFja2VkXCI+XHJcbiAgICAgICAgICAgIDx0aGVhZD5cclxuICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICA8dGg+RGF0ZTwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGg+TmFtZTwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGg+RW1haWw8L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoPkV2ZW50PC90aD5cclxuICAgICAgICAgICAgICAgIDx0aD5UaWNrZXQgVHlwZTwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGg+UXR5PC90aD5cclxuICAgICAgICAgICAgICAgIDx0aD5Ib3N0IEVhcm5zPC90aD5cclxuICAgICAgICAgICAgICAgIDx0aD5QbGF0Zm9ybSBFYXJuczwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGg+QnV5ZXIgUGFpZDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGg+VHJhbnNhY3Rpb24gSUQ8L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoPlJlc2VuZCBFbWFpbDwvdGg+XHJcbiAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgPHRib2R5PlxyXG4gICAgICAgICAgICAgIHtwYWdpbmF0ZWRUaWNrZXRzLm1hcCgodGlja2V0KSA9PiAoXHJcbiAgICAgICAgICAgICAgICA8dHIga2V5PXt0aWNrZXQuaWR9PlxyXG4gICAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbD1cIkRhdGVcIj57dGlja2V0LmRhdGV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWw9XCJOYW1lXCI+e3RpY2tldC5uYW1lfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiRW1haWxcIj57dGlja2V0LmVtYWlsfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiRXZlbnRcIj57ZXZlbnRzLmZpbmQoKGV2ZW50KSA9PiBldmVudC5pZCA9PT0gdGlja2V0LmV2ZW50SWQpPy50aXRsZSB8fCBcIk4vQVwifTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiVGlja2V0IFR5cGVcIj57dGlja2V0LnRpY2tldFR5cGV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWw9XCJRdHlcIj57dGlja2V0LnF1YW50aXR5fTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiSG9zdCBFYXJuc1wiIGNsYXNzTmFtZT1cImFkbWluLXZhbHVlIGFkbWluLXZhbHVlLWJsdWVcIj5cclxuICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0TmFpcmEodGlja2V0LnRvdGFsUGFpZCB8fCAwKX1cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWw9XCJQbGF0Zm9ybSBFYXJuc1wiIGNsYXNzTmFtZT1cImFkbWluLXZhbHVlIGFkbWluLXZhbHVlLWVtZXJhbGRcIj5cclxuICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0TmFpcmEoKHRpY2tldC5ob3N0RmVlIHx8IDApICsgKHRpY2tldC5zZXJ2aWNlRmVlIHx8IDApKX1cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGRhdGEtbGFiZWw9XCJCdXllciBQYWlkXCIgY2xhc3NOYW1lPVwiYWRtaW4tdmFsdWVcIj5cclxuICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0TmFpcmEodGlja2V0LnRvdGFsQ2hhcmdlZCB8fCB0aWNrZXQudG90YWxQYWlkIHx8IDApfVxyXG4gICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbD1cIlRyYW5zYWN0aW9uIElEXCI+e3RpY2tldC50cmFuc2FjdGlvbklkfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiUmVzZW5kIEVtYWlsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhZG1pbi1pbmxpbmUtYnRuIGFkbWluLWlubGluZS1idG4tYW1iZXJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlUmVzZW5kRW1haWwodGlja2V0KX1cclxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtyZXNlbmRpbmdJZCA9PT0gdGlja2V0LmlkfVxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIDxGaU1haWwgYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgIHtyZXNlbmRpbmdJZCA9PT0gdGlja2V0LmlkID8gXCJTZW5kaW5nLi4uXCIgOiBcIlJlc2VuZFwifVxyXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHt0b3RhbFBhZ2VzID4gMSA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4tcGFnaW5hdGlvblwiPlxyXG4gICAgICAgICAgICB7QXJyYXkuZnJvbSh7IGxlbmd0aDogdG90YWxQYWdlcyB9LCAoXywgaW5kZXgpID0+IGluZGV4ICsgMSkubWFwKChwYWdlTnVtYmVyKSA9PiAoXHJcbiAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAga2V5PXtwYWdlTnVtYmVyfVxyXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BhZG1pbi1wYWdlLWJ0biAke2N1cnJlbnRQYWdlID09PSBwYWdlTnVtYmVyID8gXCJpcy1hY3RpdmVcIiA6IFwiXCJ9YH1cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEN1cnJlbnRQYWdlKHBhZ2VOdW1iZXIpfVxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIHtwYWdlTnVtYmVyfVxyXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICApKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICkgOiBudWxsfVxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJhZG1pbi1wYW5lbFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4tcGFuZWwtaGVhZFwiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWRtaW4tcGFuZWwtY2hpcFwiPlxyXG4gICAgICAgICAgICAgIDxGaUNsb2NrIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIC8+XHJcbiAgICAgICAgICAgICAgV2l0aGRyYXdhbCByZXZpZXdcclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICA8aDI+V2l0aGRyYXdhbCByZXF1ZXN0czwvaDI+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIHtwZW5kaW5nQ291bnQgPiAwID8gKFxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhZG1pbi1hbGVydC1waWxsXCI+e3BlbmRpbmdDb3VudH0gcGVuZGluZzwvc3Bhbj5cclxuICAgICAgICAgICkgOiBudWxsfVxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICB7d2l0aGRyYXdhbHMubGVuZ3RoID09PSAwID8gKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1lbXB0eS1zdGF0ZVwiPlxyXG4gICAgICAgICAgICA8cD5ObyB3aXRoZHJhd2FsIHJlcXVlc3RzIHlldC48L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApIDogKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi10YWJsZS13cmFwXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJhZG1pbi10YWJsZSBhZG1pbi10YWJsZS1zdGFja2VkXCI+XHJcbiAgICAgICAgICAgICAgPHRoZWFkPlxyXG4gICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICA8dGg+RGF0ZTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aD5Ib3N0PC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoPkFjY291bnQgTmFtZTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aD5BY2NvdW50IE5vLjwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aD5CYW5rPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoPkFtb3VudDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aD5Ob3RlPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoPlN0YXR1czwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aD5BY3Rpb25zPC90aD5cclxuICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgICB7d2l0aGRyYXdhbHMubWFwKCh3aXRoZHJhd2FsKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e3dpdGhkcmF3YWwuaWR9PlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiRGF0ZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge3dpdGhkcmF3YWwudGltZXN0YW1wID8gbmV3IERhdGUod2l0aGRyYXdhbC50aW1lc3RhbXApLnRvTG9jYWxlRGF0ZVN0cmluZygpIDogXCJOL0FcIn1cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiSG9zdFwiPnt3aXRoZHJhd2FsLmhvc3RFbWFpbH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiQWNjb3VudCBOYW1lXCI+e3dpdGhkcmF3YWwuYWNjb3VudE5hbWV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbD1cIkFjY291bnQgTm8uXCI+e3dpdGhkcmF3YWwuYWNjb3VudE51bWJlcn08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiQmFua1wiPnt3aXRoZHJhd2FsLmJhbmt9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbD1cIkFtb3VudFwiIGNsYXNzTmFtZT1cImFkbWluLXZhbHVlIGFkbWluLXZhbHVlLWVtZXJhbGRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXROYWlyYSh3aXRoZHJhd2FsLmFtb3VudCl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbD1cIk5vdGVcIj57d2l0aGRyYXdhbC5ub3RlIHx8IFwi4oCUXCJ9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgZGF0YS1sYWJlbD1cIlN0YXR1c1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtnZXRTdGF0dXNCYWRnZUNsYXNzKHdpdGhkcmF3YWwuc3RhdHVzKX0+e3dpdGhkcmF3YWwuc3RhdHVzfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBkYXRhLWxhYmVsPVwiQWN0aW9uc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge3dpdGhkcmF3YWwuc3RhdHVzID09PSBcInBlbmRpbmdcIiA/IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhZG1pbi1hY3Rpb24tcm93XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhZG1pbi1pbmxpbmUtYnRuIGFkbWluLWlubGluZS1idG4tYXBwcm92ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVXaXRoZHJhd2FsU3RhdHVzKHdpdGhkcmF3YWwuaWQsIFwiY29tcGxldGVkXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFwcHJvdmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFkbWluLWlubGluZS1idG4gYWRtaW4taW5saW5lLWJ0bi1yZWplY3RcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlV2l0aGRyYXdhbFN0YXR1cyh3aXRoZHJhd2FsLmlkLCBcInJlamVjdGVkXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlamVjdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFkbWluLXByb2Nlc3NlZC1ub3RlXCI+UHJvY2Vzc2VkPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICAgIHtzaG93RXZlbnRMaXN0ID8gKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4tbW9kYWwtYmFja2Ryb3BcIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RXZlbnRMaXN0KGZhbHNlKX0+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLW1vZGFsXCIgb25DbGljaz17KGV2ZW50KSA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKX0+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWRtaW4tbW9kYWwtaGVhZFwiPlxyXG4gICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhZG1pbi1wYW5lbC1jaGlwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxGaUV5ZSBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICBFdmVudCBpbmRleFxyXG4gICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPGgyPkN1cnJlbnQgZXZlbnRzPC9oMj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFkbWluLWljb24tYnRuXCJcclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dFdmVudExpc3QoZmFsc2UpfVxyXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkNsb3NlIGV2ZW50IGxpc3RcIlxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIDxGaVggYXJpYS1oaWRkZW49XCJ0cnVlXCIgLz5cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLWV2ZW50LWxpc3RcIj5cclxuICAgICAgICAgICAgICB7ZXZlbnRzLm1hcCgoZXZlbnQpID0+IChcclxuICAgICAgICAgICAgICAgIDxhcnRpY2xlIGtleT17ZXZlbnQuaWR9IGNsYXNzTmFtZT1cImFkbWluLWV2ZW50LWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPntldmVudC50aXRsZX08L3N0cm9uZz5cclxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj57ZXZlbnQuZGF0ZSA9PT0gXCJUQkFcIiA/IFwiRGF0ZSBUQkFcIiA6IGV2ZW50LmRhdGUgfHwgXCJObyBkYXRlIHNldFwifTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFkbWluLWV2ZW50LWFjdGlvbnNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJhZG1pbi1pY29uLWJ0blwiIG9uQ2xpY2s9eygpID0+IG5hdmlnYXRlKGAvZXZlbnQvZWRpdC8ke2V2ZW50LmlkfWApfT5cclxuICAgICAgICAgICAgICAgICAgICAgIDxGaUVkaXQzIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYWRtaW4taWNvbi1idG4gYWRtaW4taWNvbi1idG4tZGFuZ2VyXCIgb25DbGljaz17KCkgPT4gaGFuZGxlRGVsZXRlRXZlbnQoZXZlbnQuaWQpfT5cclxuICAgICAgICAgICAgICAgICAgICAgIDxGaVRyYXNoMiBhcmlhLWhpZGRlbj1cInRydWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvYXJ0aWNsZT5cclxuICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgKSA6IG51bGx9XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQWRtaW5EYXNoYm9hcmQ7XHJcbiJdLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsInJlZiIsIm9uVmFsdWUiLCJyZW1vdmUiLCJ1cGRhdGUiLCJnZXQiLCJkYXRhYmFzZSIsImF1dGgiLCJDU1ZMaW5rIiwiTGluayIsInVzZU5hdmlnYXRlIiwiZW1haWxqcyIsIkJhckNoYXJ0IiwiQmFyIiwiWEF4aXMiLCJZQXhpcyIsIlRvb2x0aXAiLCJSZXNwb25zaXZlQ29udGFpbmVyIiwiRmlBY3Rpdml0eSIsIkZpQ2FsZW5kYXIiLCJGaUNoZWNrQ2lyY2xlIiwiRmlDbG9jayIsIkZpQ3JlZGl0Q2FyZCIsIkZpRG9sbGFyU2lnbiIsIkZpRG93bmxvYWQiLCJGaUVkaXQzIiwiRmlFeWUiLCJGaU1haWwiLCJGaVNlYXJjaCIsIkZpVHJhc2gyIiwiRmlUcmVuZGluZ1VwIiwiRmlVc2VycyIsIkZpWCIsIlJlbW90ZUFkbWluT3ZlcnZpZXciLCJ1c2VTYWxlc1RyZW5kIiwiRU1BSUxKU19TRVJWSUNFX0lEIiwiZW52IiwiVklURV9FTUFJTEpTX1NFUlZJQ0VfSUQiLCJFTUFJTEpTX1RFTVBMQVRFX0lEIiwiVklURV9FTUFJTEpTX1RFTVBMQVRFX0lEIiwiRU1BSUxKU19QVUJMSUNfS0VZIiwiVklURV9FTUFJTEpTX1BVQkxJQ19LRVkiLCJmb3JtYXROYWlyYSIsInZhbHVlIiwiTnVtYmVyIiwidG9Mb2NhbGVTdHJpbmciLCJBZG1pbkRhc2hib2FyZCIsImV2ZW50cyIsInNldEV2ZW50cyIsInRpY2tldHMiLCJzZXRUaWNrZXRzIiwid2l0aGRyYXdhbHMiLCJzZXRXaXRoZHJhd2FscyIsInNob3dFdmVudExpc3QiLCJzZXRTaG93RXZlbnRMaXN0IiwibmF2aWdhdGUiLCJzZWFyY2hUZXJtIiwic2V0U2VhcmNoVGVybSIsImN1cnJlbnRQYWdlIiwic2V0Q3VycmVudFBhZ2UiLCJyZXNlbmRpbmdJZCIsInNldFJlc2VuZGluZ0lkIiwiaXRlbXNQZXJQYWdlIiwiZXZlbnRzUmVmIiwic25hcHNob3QiLCJkYXRhIiwidmFsIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsImlkIiwidGlja2V0c1JlZiIsImRhdGUiLCJ0aW1lc3RhbXAiLCJEYXRlIiwidG9Mb2NhbGVEYXRlU3RyaW5nIiwid2l0aGRyYXdhbHNSZWYiLCJyZXF1ZXN0c0FycmF5Iiwic29ydCIsImxlZnQiLCJyaWdodCIsInRvdGFsRXZlbnRzIiwibGVuZ3RoIiwidG90YWxUaWNrZXRzU29sZCIsInJlZHVjZSIsInN1bSIsInRpY2tldCIsInF1YW50aXR5IiwidG90YWxSZXZlbnVlIiwidG90YWxDaGFyZ2VkIiwidG90YWxQYWlkIiwicGxhdGZvcm1SZXZlbnVlIiwiaG9zdEZlZSIsInNlcnZpY2VGZWUiLCJ0b3RhbEF0dGVuZGVlcyIsIlNldCIsImVtYWlsIiwic2l6ZSIsInRvdGFsUGFpZE91dCIsImZpbHRlciIsIndpdGhkcmF3YWwiLCJzdGF0dXMiLCJhbW91bnQiLCJwZW5kaW5nQ291bnQiLCJob3N0QnJlYWtkb3duIiwiYnJlYWtkb3duIiwiYWNjdW11bGF0b3IiLCJob3N0RW1haWwiLCJ0b3RhbEVhcm5lZCIsIndpdGhkcmF3biIsImZvckVhY2giLCJ2YWx1ZXMiLCJob3N0Iiwic3RpbGxPd2VkIiwiTWF0aCIsIm1heCIsInRvdGFsT3dlZFRvSG9zdHMiLCJzYWxlc0RhdGEiLCJub3ciLCJ0b3RhbCIsInJlbW90ZVNhbGVzIiwiaXNMb2FkaW5nIiwicmVtb3RlU2FsZXNMb2FkaW5nIiwiZmlsdGVyZWRUaWNrZXRzIiwiZXZlbnRFeGlzdHMiLCJzb21lIiwiZXZlbnQiLCJldmVudElkIiwibWF0Y2hpbmdFdmVudFRpdGxlIiwiZmluZCIsInRpdGxlIiwibm9ybWFsaXplZFNlYXJjaCIsInRvTG93ZXJDYXNlIiwibWF0Y2hlc1NlYXJjaCIsImluY2x1ZGVzIiwicGFnaW5hdGVkVGlja2V0cyIsInNsaWNlIiwidG90YWxQYWdlcyIsImNlaWwiLCJzZW5kQXVkaXQiLCJhY3Rpb24iLCJkZXRhaWxzIiwiY3VycmVudFVzZXIiLCJ0b2tlbiIsImdldElkVG9rZW4iLCJmZXRjaCIsIm1ldGhvZCIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJlcnIiLCJjb25zb2xlIiwid2FybiIsImhhbmRsZURlbGV0ZUV2ZW50Iiwid2luZG93IiwiY29uZmlybSIsImV4aXN0cyIsInRpY2tldHNEYXRhIiwiZGVsZXRlUHJvbWlzZXMiLCJ0aWNrZXRJZCIsIlByb21pc2UiLCJhbGwiLCJhbGVydCIsImVycm9yIiwibWVzc2FnZSIsImhhbmRsZVdpdGhkcmF3YWxTdGF0dXMiLCJoYW5kbGVSZXNlbmRFbWFpbCIsImN1cnJlbnRFdmVudCIsInRpY2tldFByaWNlIiwic2VuZCIsInRvX2VtYWlsIiwidXNlcl9uYW1lIiwibmFtZSIsImV2ZW50X25hbWUiLCJldmVudFRpdGxlIiwiZXZlbnRfZGF0ZSIsImV2ZW50X2xvY2F0aW9uIiwibG9jYXRpb24iLCJ0aWNrZXRfdHlwZSIsInRpY2tldFR5cGUiLCJTdHJpbmciLCJ1bml0X3ByaWNlIiwidG90YWxfcGFpZCIsIm9yZGVyX2lkIiwidHJhbnNhY3Rpb25JZCIsInFyX2NvZGVfdXJsIiwiZW5jb2RlVVJJQ29tcG9uZW50Iiwic3VwcG9ydF9lbWFpbCIsImNvbXBhbnlfbmFtZSIsImN1cnJlbnRfeWVhciIsImdldEZ1bGxZZWFyIiwidG8iLCJ0ZXh0IiwiZ2V0U3RhdHVzQmFkZ2VDbGFzcyIsImRpdiIsImNsYXNzTmFtZSIsInNlY3Rpb24iLCJzcGFuIiwiaDEiLCJwIiwiYXJpYS1oaWRkZW4iLCJidXR0b24iLCJ0eXBlIiwib25DbGljayIsImZpbGVuYW1lIiwic3Ryb25nIiwic21hbGwiLCJzdHlsZSIsIndpZHRoIiwiYXJ0aWNsZSIsImgyIiwidGFibGUiLCJ0aGVhZCIsInRyIiwidGgiLCJ0Ym9keSIsInRkIiwiZGF0YS1sYWJlbCIsImhlaWdodCIsImRhdGFLZXkiLCJmb3JtYXR0ZXIiLCJmaWxsIiwicmFkaXVzIiwibGFiZWwiLCJpbnB1dCIsInBsYWNlaG9sZGVyIiwib25DaGFuZ2UiLCJ0YXJnZXQiLCJkaXNhYmxlZCIsIkFycmF5IiwiZnJvbSIsIl8iLCJpbmRleCIsInBhZ2VOdW1iZXIiLCJhY2NvdW50TmFtZSIsImFjY291bnROdW1iZXIiLCJiYW5rIiwibm90ZSIsInN0b3BQcm9wYWdhdGlvbiIsImFyaWEtbGFiZWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE9BQU9BLFNBQVNDLFNBQVMsRUFBRUMsT0FBTyxFQUFFQyxRQUFRLFFBQVEsUUFBUTtBQUM1RCxTQUFTQyxHQUFHLEVBQUVDLE9BQU8sRUFBRUMsTUFBTSxFQUFFQyxNQUFNLEVBQUVDLEdBQUcsUUFBUSxvQkFBb0I7QUFDdEUsU0FBU0MsUUFBUSxFQUFFQyxJQUFJLFFBQVEsNkJBQTZCO0FBQzVELFNBQVNDLE9BQU8sUUFBUSxZQUFZO0FBQ3BDLFNBQVNDLElBQUksRUFBRUMsV0FBVyxRQUFRLG1CQUFtQjtBQUNyRCxPQUFPQyxhQUFhLG1CQUFtQjtBQUN2QyxTQUFTQyxRQUFRLEVBQUVDLEdBQUcsRUFBRUMsS0FBSyxFQUFFQyxLQUFLLEVBQUVDLE9BQU8sRUFBRUMsbUJBQW1CLFFBQVEsV0FBVztBQUNyRixTQUNFQyxVQUFVLEVBQ1ZDLFVBQVUsRUFDVkMsYUFBYSxFQUNiQyxPQUFPLEVBQ1BDLFlBQVksRUFDWkMsWUFBWSxFQUNaQyxVQUFVLEVBQ1ZDLE9BQU8sRUFDUEMsS0FBSyxFQUNMQyxNQUFNLEVBQ05DLFFBQVEsRUFDUkMsUUFBUSxFQUNSQyxZQUFZLEVBQ1pDLE9BQU8sRUFDUEMsR0FBRyxRQUNFLGlCQUFpQjtBQUN4QixPQUFPQyx5QkFBeUIsMkNBQTJDO0FBQzNFLE9BQU8sOEJBQThCO0FBQ3JDLFNBQVNDLGFBQWEsUUFBUSx5QkFBeUI7QUFFdkQsTUFBTUMscUJBQXFCLFlBQVlDLEdBQUcsQ0FBQ0MsdUJBQXVCLElBQUk7QUFDdEUsTUFBTUMsc0JBQXNCLFlBQVlGLEdBQUcsQ0FBQ0csd0JBQXdCLElBQUk7QUFDeEUsTUFBTUMscUJBQXFCLFlBQVlKLEdBQUcsQ0FBQ0ssdUJBQXVCLElBQUk7QUFFdEUsTUFBTUMsY0FBYyxDQUFDQyxRQUFVLENBQUMsSUFBSSxFQUFFQyxPQUFPRCxTQUFTLEdBQUdFLGNBQWMsSUFBSTtBQUUzRSxNQUFNQyxpQkFBaUI7O0lBQ3JCLE1BQU0sQ0FBQ0MsUUFBUUMsVUFBVSxHQUFHaEQsU0FBUyxFQUFFO0lBQ3ZDLE1BQU0sQ0FBQ2lELFNBQVNDLFdBQVcsR0FBR2xELFNBQVMsRUFBRTtJQUN6QyxNQUFNLENBQUNtRCxhQUFhQyxlQUFlLEdBQUdwRCxTQUFTLEVBQUU7SUFDakQsTUFBTSxDQUFDcUQsZUFBZUMsaUJBQWlCLEdBQUd0RCxTQUFTO0lBQ25ELE1BQU11RCxXQUFXN0M7SUFDakIsTUFBTSxDQUFDOEMsWUFBWUMsY0FBYyxHQUFHekQsU0FBUztJQUM3QyxNQUFNLENBQUMwRCxhQUFhQyxlQUFlLEdBQUczRCxTQUFTO0lBQy9DLE1BQU0sQ0FBQzRELGFBQWFDLGVBQWUsR0FBRzdELFNBQVM7SUFDL0MsTUFBTThELGVBQWU7SUFFckJoRSxVQUFVO1FBQ1IsTUFBTWlFLFlBQVk5RCxJQUFJSyxVQUFVO1FBQ2hDSixRQUFRNkQsV0FBVyxDQUFDQztZQUNsQixNQUFNQyxPQUFPRCxTQUFTRSxHQUFHLE1BQU0sQ0FBQztZQUNoQ2xCLFVBQVVtQixPQUFPQyxPQUFPLENBQUNILE1BQU1JLEdBQUcsQ0FBQyxDQUFDLENBQUNDLElBQUkzQixNQUFNLEdBQU0sQ0FBQTtvQkFBRTJCO29CQUFJLEdBQUczQixLQUFLO2dCQUFDLENBQUE7UUFDdEU7UUFFQSxNQUFNNEIsYUFBYXRFLElBQUlLLFVBQVU7UUFDakNKLFFBQVFxRSxZQUFZLENBQUNQO1lBQ25CLE1BQU1DLE9BQU9ELFNBQVNFLEdBQUcsTUFBTSxDQUFDO1lBQ2hDaEIsV0FDRWlCLE9BQU9DLE9BQU8sQ0FBQ0gsTUFBTUksR0FBRyxDQUFDLENBQUMsQ0FBQ0MsSUFBSTNCLE1BQU0sR0FBTSxDQUFBO29CQUN6QzJCO29CQUNBLEdBQUczQixLQUFLO29CQUNSNkIsTUFBTTdCLE1BQU04QixTQUFTLEdBQUcsSUFBSUMsS0FBSy9CLE1BQU04QixTQUFTLEVBQUVFLGtCQUFrQixLQUFLO2dCQUMzRSxDQUFBO1FBRUo7UUFFQSxNQUFNQyxpQkFBaUIzRSxJQUFJSyxVQUFVO1FBQ3JDSixRQUFRMEUsZ0JBQWdCLENBQUNaO1lBQ3ZCLE1BQU1DLE9BQU9ELFNBQVNFLEdBQUcsTUFBTSxDQUFDO1lBQ2hDLE1BQU1XLGdCQUFnQlYsT0FBT0MsT0FBTyxDQUFDSCxNQUNsQ0ksR0FBRyxDQUFDLENBQUMsQ0FBQ0MsSUFBSTNCLE1BQU0sR0FBTSxDQUFBO29CQUFFMkI7b0JBQUksR0FBRzNCLEtBQUs7Z0JBQUMsQ0FBQSxHQUNyQ21DLElBQUksQ0FBQyxDQUFDQyxNQUFNQyxRQUFVLEFBQUNBLENBQUFBLE1BQU1QLFNBQVMsSUFBSSxDQUFBLElBQU1NLENBQUFBLEtBQUtOLFNBQVMsSUFBSSxDQUFBO1lBQ3JFckIsZUFBZXlCO1FBQ2pCO0lBQ0YsR0FBRyxFQUFFO0lBRUwsTUFBTUksY0FBY2xDLE9BQU9tQyxNQUFNO0lBQ2pDLE1BQU1DLG1CQUFtQmxDLFFBQVFtQyxNQUFNLENBQUMsQ0FBQ0MsS0FBS0MsU0FBV0QsTUFBT0MsQ0FBQUEsT0FBT0MsUUFBUSxJQUFJLENBQUEsR0FBSTtJQUN2RixNQUFNQyxlQUFldkMsUUFBUW1DLE1BQU0sQ0FBQyxDQUFDQyxLQUFLQyxTQUFXRCxNQUFPQyxDQUFBQSxPQUFPRyxZQUFZLElBQUlILE9BQU9JLFNBQVMsSUFBSSxDQUFBLEdBQUk7SUFDM0csTUFBTUMsa0JBQWtCMUMsUUFBUW1DLE1BQU0sQ0FDcEMsQ0FBQ0MsS0FBS0MsU0FBV0QsTUFBTyxDQUFBLEFBQUNDLENBQUFBLE9BQU9NLE9BQU8sSUFBSSxDQUFBLElBQU1OLENBQUFBLE9BQU9PLFVBQVUsSUFBSSxDQUFBLENBQUMsR0FDdkU7SUFFRixNQUFNQyxpQkFBaUIsSUFBSUMsSUFBSTlDLFFBQVFvQixHQUFHLENBQUMsQ0FBQ2lCLFNBQVdBLE9BQU9VLEtBQUssR0FBR0MsSUFBSTtJQUMxRSxNQUFNQyxlQUFlL0MsWUFDbEJnRCxNQUFNLENBQUMsQ0FBQ0MsYUFBZUEsV0FBV0MsTUFBTSxLQUFLLGFBQzdDakIsTUFBTSxDQUFDLENBQUNDLEtBQUtlLGFBQWVmLE1BQU9lLENBQUFBLFdBQVdFLE1BQU0sSUFBSSxDQUFBLEdBQUk7SUFDL0QsTUFBTUMsZUFBZXBELFlBQVlnRCxNQUFNLENBQUMsQ0FBQ0MsYUFBZUEsV0FBV0MsTUFBTSxLQUFLLFdBQVduQixNQUFNO0lBRS9GLE1BQU1zQixnQkFBZ0J6RyxRQUFRO1FBQzVCLE1BQU0wRyxZQUFZeEQsUUFBUW1DLE1BQU0sQ0FBQyxDQUFDc0IsYUFBYXBCO1lBQzdDLE1BQU1xQixZQUFZckIsT0FBT3FCLFNBQVMsSUFBSTtZQUV0QyxJQUFJLENBQUNELFdBQVcsQ0FBQ0MsVUFBVSxFQUFFO2dCQUMzQkQsV0FBVyxDQUFDQyxVQUFVLEdBQUc7b0JBQ3ZCQTtvQkFDQUMsYUFBYTtvQkFDYjNELFNBQVM7b0JBQ1Q0RCxXQUFXO2dCQUNiO1lBQ0Y7WUFFQUgsV0FBVyxDQUFDQyxVQUFVLENBQUNDLFdBQVcsSUFBSXRCLE9BQU9JLFNBQVMsSUFBSTtZQUMxRGdCLFdBQVcsQ0FBQ0MsVUFBVSxDQUFDMUQsT0FBTyxJQUFJcUMsT0FBT0MsUUFBUSxJQUFJO1lBQ3JELE9BQU9tQjtRQUNULEdBQUcsQ0FBQztRQUVKdkQsWUFDR2dELE1BQU0sQ0FBQyxDQUFDQyxhQUFlQSxXQUFXQyxNQUFNLEtBQUssYUFDN0NTLE9BQU8sQ0FBQyxDQUFDVjtZQUNSLE1BQU1PLFlBQVlQLFdBQVdPLFNBQVM7WUFDdEMsSUFBSUYsU0FBUyxDQUFDRSxVQUFVLEVBQUU7Z0JBQ3hCRixTQUFTLENBQUNFLFVBQVUsQ0FBQ0UsU0FBUyxJQUFJVCxXQUFXRSxNQUFNLElBQUk7WUFDekQ7UUFDRjtRQUVGLE9BQU9uQyxPQUFPNEMsTUFBTSxDQUFDTixXQUNsQnBDLEdBQUcsQ0FBQyxDQUFDMkMsT0FBVSxDQUFBO2dCQUNkLEdBQUdBLElBQUk7Z0JBQ1BDLFdBQVdDLEtBQUtDLEdBQUcsQ0FBQyxHQUFHSCxLQUFLSixXQUFXLEdBQUdJLEtBQUtILFNBQVM7WUFDMUQsQ0FBQSxHQUNDL0IsSUFBSSxDQUFDLENBQUNDLE1BQU1DLFFBQVVBLE1BQU00QixXQUFXLEdBQUc3QixLQUFLNkIsV0FBVztJQUMvRCxHQUFHO1FBQUMzRDtRQUFTRTtLQUFZO0lBRXpCLE1BQU1pRSxtQkFBbUJaLGNBQWNwQixNQUFNLENBQUMsQ0FBQ0MsS0FBSzJCLE9BQVMzQixNQUFNMkIsS0FBS0MsU0FBUyxFQUFFO0lBRW5GLE1BQU1JLFlBQVlsRCxPQUFPNEMsTUFBTSxDQUM3QjlELFFBQVFtQyxNQUFNLENBQUMsQ0FBQ3NCLGFBQWFwQjtRQUMzQixNQUFNZCxPQUFPLElBQUlFLEtBQUtZLE9BQU9iLFNBQVMsSUFBSUMsS0FBSzRDLEdBQUcsSUFBSTNDLGtCQUFrQjtRQUN4RStCLFdBQVcsQ0FBQ2xDLEtBQUssR0FBR2tDLFdBQVcsQ0FBQ2xDLEtBQUssSUFBSTtZQUFFQTtZQUFNK0MsT0FBTztRQUFFO1FBQzFEYixXQUFXLENBQUNsQyxLQUFLLENBQUMrQyxLQUFLLElBQUlqQyxPQUFPSSxTQUFTLElBQUk7UUFDL0MsT0FBT2dCO0lBQ1QsR0FBRyxDQUFDO0lBR04sOENBQThDO0lBQzlDLE1BQU0sRUFBRXpDLE1BQU11RCxXQUFXLEVBQUVDLFdBQVdDLGtCQUFrQixFQUFFLEdBQUd4RixjQUFjO0lBRTNFLE1BQU15RixrQkFBa0IxRSxRQUNyQjZCLElBQUksQ0FBQyxDQUFDQyxNQUFNQyxRQUFVLEFBQUNBLENBQUFBLE1BQU1QLFNBQVMsSUFBSSxDQUFBLElBQU1NLENBQUFBLEtBQUtOLFNBQVMsSUFBSSxDQUFBLEdBQ2xFMEIsTUFBTSxDQUFDLENBQUNiO1FBQ1AsTUFBTXNDLGNBQWM3RSxPQUFPOEUsSUFBSSxDQUFDLENBQUNDLFFBQVVBLE1BQU14RCxFQUFFLEtBQUtnQixPQUFPeUMsT0FBTztRQUN0RSxNQUFNQyxxQkFBcUJqRixPQUFPa0YsSUFBSSxDQUFDLENBQUNILFFBQVVBLE1BQU14RCxFQUFFLEtBQUtnQixPQUFPeUMsT0FBTyxHQUFHRyxTQUFTO1FBQ3pGLE1BQU1DLG1CQUFtQjNFLFdBQVc0RSxXQUFXO1FBRS9DLE1BQU1DLGdCQUNKL0MsT0FBT1UsS0FBSyxFQUFFb0MsY0FBY0UsU0FBU0gscUJBQ3JDSCxtQkFBbUJJLFdBQVcsR0FBR0UsUUFBUSxDQUFDSDtRQUU1QyxPQUFPUCxlQUFlUztJQUN4QjtJQUVGLE1BQU1FLG1CQUFtQlosZ0JBQWdCYSxLQUFLLENBQzVDLEFBQUM5RSxDQUFBQSxjQUFjLENBQUEsSUFBS0ksY0FDcEJKLGNBQWNJO0lBRWhCLE1BQU0yRSxhQUFhdkIsS0FBS3dCLElBQUksQ0FBQ2YsZ0JBQWdCekMsTUFBTSxHQUFHcEI7SUFFdEQsTUFBTTZFLFlBQVksT0FBT0MsUUFBUUM7UUFDL0IsSUFBSTtZQUNGLElBQUksQ0FBQ3RJLFFBQVEsQ0FBQ0EsS0FBS3VJLFdBQVcsRUFBRTtZQUNoQyxNQUFNQyxRQUFRLE1BQU14SSxLQUFLdUksV0FBVyxDQUFDRSxVQUFVLENBQUM7WUFDaEQsTUFBTUMsTUFBTSxnQkFBZ0I7Z0JBQzFCQyxRQUFRO2dCQUNSQyxTQUFTO29CQUNQLGdCQUFnQjtvQkFDaEJDLGVBQWUsQ0FBQyxPQUFPLEVBQUVMLE9BQU87Z0JBQ2xDO2dCQUNBTSxNQUFNQyxLQUFLQyxTQUFTLENBQUM7b0JBQUVYO29CQUFRQztnQkFBUTtZQUN6QztRQUNGLEVBQUUsT0FBT1csS0FBSztZQUNaQyxRQUFRQyxJQUFJLENBQUMsNEJBQTRCRjtRQUMzQztJQUNGO0lBRUEsTUFBTUcsb0JBQW9CLE9BQU81QjtRQUMvQixJQUFJNkIsT0FBT0MsT0FBTyxDQUFDLG9FQUFvRTtZQUNyRixJQUFJO2dCQUNGLE1BQU10RixhQUFhdEUsSUFBSUssVUFBVTtnQkFDakMsTUFBTTBELFdBQVcsTUFBTTNELElBQUlrRTtnQkFFM0IsSUFBSVAsU0FBUzhGLE1BQU0sSUFBSTtvQkFDckIsTUFBTUMsY0FBYy9GLFNBQVNFLEdBQUc7b0JBQ2hDLE1BQU04RixpQkFBaUI3RixPQUFPQyxPQUFPLENBQUMyRixhQUNuQzVELE1BQU0sQ0FBQyxDQUFDLEdBQUdiLE9BQU8sR0FBS0EsT0FBT3lDLE9BQU8sS0FBS0EsU0FDMUMxRCxHQUFHLENBQUMsQ0FBQyxDQUFDNEYsU0FBUyxHQUFLOUosT0FBT0YsSUFBSUssVUFBVSxDQUFDLFFBQVEsRUFBRTJKLFVBQVU7b0JBQ2pFLE1BQU1DLFFBQVFDLEdBQUcsQ0FBQ0g7Z0JBQ3BCO2dCQUVBLE1BQU03SixPQUFPRixJQUFJSyxVQUFVLENBQUMsT0FBTyxFQUFFeUgsU0FBUztnQkFDOUMsUUFBUTtnQkFDUlksVUFBVSxnQkFBZ0I7b0JBQUVaO2dCQUFRO2dCQUNwQ3FDLE1BQU07WUFDUixFQUFFLE9BQU9DLE9BQU87Z0JBQ2RELE1BQU0sQ0FBQyxzQkFBc0IsRUFBRUMsTUFBTUMsT0FBTyxFQUFFO1lBQ2hEO1FBQ0Y7SUFDRjtJQUVBLE1BQU1DLHlCQUF5QixPQUFPakcsSUFBSStCO1FBQ3hDLElBQUk7WUFDRixNQUFNakcsT0FBT0gsSUFBSUssVUFBVSxDQUFDLG1CQUFtQixFQUFFZ0UsSUFBSSxHQUFHO2dCQUFFK0I7WUFBTztZQUNqRSxRQUFRO1lBQ1JzQyxVQUFVLHFCQUFxQjtnQkFBRXJFO2dCQUFJK0I7WUFBTztZQUM1QytELE1BQU0sQ0FBQyxrQkFBa0IsRUFBRS9ELE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLEVBQUUsT0FBT2dFLE9BQU87WUFDZEQsTUFBTSxDQUFDLHlCQUF5QixFQUFFQyxNQUFNQyxPQUFPLEVBQUU7UUFDbkQ7SUFDRjtJQUVBLE1BQU1FLG9CQUFvQixPQUFPbEY7UUFDL0IsSUFBSSxDQUFDQSxPQUFPVSxLQUFLLEVBQUU7WUFDakJvRSxNQUFNO1lBQ047UUFDRjtRQUVBdkcsZUFBZXlCLE9BQU9oQixFQUFFO1FBQ3hCLE1BQU13RCxRQUFRL0UsT0FBT2tGLElBQUksQ0FBQyxDQUFDd0MsZUFBaUJBLGFBQWFuRyxFQUFFLEtBQUtnQixPQUFPeUMsT0FBTztRQUM5RSxNQUFNMkMsY0FBY3BGLE9BQU9JLFNBQVMsSUFBSTtRQUN4QyxNQUFNQSxZQUFZSixPQUFPRyxZQUFZLElBQUlILE9BQU9JLFNBQVMsSUFBSTtRQUU3RCxJQUFJdkQsc0JBQXNCRyx1QkFBdUJFLG9CQUFvQjtZQUNuRSxJQUFJO2dCQUNGLE1BQU03QixRQUFRZ0ssSUFBSSxDQUNoQnhJLG9CQUNBRyxxQkFDQTtvQkFDRXNJLFVBQVV0RixPQUFPVSxLQUFLO29CQUN0QjZFLFdBQVd2RixPQUFPd0YsSUFBSSxJQUFJeEYsT0FBT1UsS0FBSztvQkFDdEMrRSxZQUFZekYsT0FBTzBGLFVBQVUsSUFBSWxELE9BQU9JLFNBQVM7b0JBQ2pEK0MsWUFBWW5ELE9BQU90RCxRQUFRO29CQUMzQjBHLGdCQUFnQnBELE9BQU9xRCxZQUFZO29CQUNuQ0MsYUFBYTlGLE9BQU8rRixVQUFVLElBQUk7b0JBQ2xDOUYsVUFBVStGLE9BQU9oRyxPQUFPQyxRQUFRLElBQUk7b0JBQ3BDZ0csWUFBWWIsWUFBWTdILGNBQWM7b0JBQ3RDMkksWUFBWTlGLFVBQVU3QyxjQUFjO29CQUNwQzRJLFVBQVVuRyxPQUFPb0csYUFBYSxJQUFJcEcsT0FBT2hCLEVBQUU7b0JBQzNDcUgsYUFBYSxDQUFDLDhEQUE4RCxFQUFFQyxtQkFBbUJ0RyxPQUFPb0csYUFBYSxJQUFJcEcsT0FBT2hCLEVBQUUsR0FBRztvQkFDckl1SCxlQUFlO29CQUNmQyxjQUFjO29CQUNkQyxjQUFjVCxPQUFPLElBQUk1RyxPQUFPc0gsV0FBVztnQkFDN0MsR0FDQXhKO2dCQUVGLFFBQVE7Z0JBQ1JtRyxVQUFVLHVCQUF1QjtvQkFBRXNCLFVBQVUzRSxPQUFPaEIsRUFBRTtvQkFBRTJILElBQUkzRyxPQUFPVSxLQUFLO2dCQUFDO2dCQUN6RW9FLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRTlFLE9BQU9VLEtBQUssRUFBRTtZQUN0RCxFQUFFLE9BQU9xRSxPQUFPO2dCQUNkWixRQUFRWSxLQUFLLENBQUMsa0JBQWtCQTtnQkFDaENELE1BQU0sQ0FBQyx3QkFBd0IsRUFBRUMsTUFBTTZCLElBQUksSUFBSTdCLE1BQU1DLE9BQU8sRUFBRTtZQUNoRTtRQUNGLE9BQU87WUFDTGIsUUFBUUMsSUFBSSxDQUFDO1lBQ2JVLE1BQU07UUFDUjtRQUVBdkcsZUFBZTtJQUNqQjtJQUVBLE1BQU1zSSxzQkFBc0IsQ0FBQzlGLFNBQVcsQ0FBQywwQkFBMEIsRUFBRUEsVUFBVSxXQUFXO0lBRTFGLHFCQUNFLFFBQUMrRjtRQUFJQyxXQUFVOzswQkFDYixRQUFDQztnQkFBUUQsV0FBVTs7a0NBQ2pCLFFBQUNEO3dCQUFJQyxXQUFVOzswQ0FDYixRQUFDRTtnQ0FBS0YsV0FBVTswQ0FBZTs7Ozs7OzBDQUMvQixRQUFDRzswQ0FBRzs7Ozs7OzBDQUNKLFFBQUNDOzBDQUFFOzs7Ozs7MENBR0gsUUFBQ0w7Z0NBQUlDLFdBQVU7O2tEQUNiLFFBQUM1TDt3Q0FBS3dMLElBQUc7d0NBQWFJLFdBQVU7OzBEQUM5QixRQUFDbEw7Z0RBQVd1TCxlQUFZOzs7Ozs7NENBQVM7Ozs7Ozs7a0RBR25DLFFBQUNDO3dDQUNDQyxNQUFLO3dDQUNMUCxXQUFVO3dDQUNWUSxTQUFTLElBQU12SixpQkFBaUI7OzBEQUVoQyxRQUFDNUI7Z0RBQU1nTCxlQUFZOzs7Ozs7NENBQVM7Ozs7Ozs7a0RBRzlCLFFBQUNsTTt3Q0FBUXlELE1BQU0wRDt3Q0FBaUJtRixVQUFTO3dDQUFjVCxXQUFVOzswREFDL0QsUUFBQzdLO2dEQUFXa0wsZUFBWTs7Ozs7OzRDQUFTOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tDQU12QyxRQUFDTjt3QkFBSUMsV0FBVTs7MENBQ2IsUUFBQ0Q7Z0NBQUlDLFdBQVU7O2tEQUNiLFFBQUNFO2tEQUFLOzs7Ozs7a0RBQ04sUUFBQ1E7a0RBQVE5SDs7Ozs7O2tEQUNULFFBQUMrSDtrREFBTTs7Ozs7Ozs7Ozs7OzBDQUVULFFBQUNaO2dDQUFJQyxXQUFVOztrREFDYixRQUFDRTtrREFBSzs7Ozs7O2tEQUNOLFFBQUNRO2tEQUFReEc7Ozs7OztrREFDVCxRQUFDeUc7a0RBQU07Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzswQkFNYixRQUFDVjtnQkFBUUQsV0FBVTswQkFDakIsY0FBQSxRQUFDRDtvQkFBSWEsT0FBTzt3QkFBRUMsT0FBTztvQkFBTzs4QkFFMUIsY0FBQSxRQUFDakw7Ozs7Ozs7Ozs7Ozs7OzswQkFJTCxRQUFDcUs7Z0JBQVFELFdBQVU7O2tDQUNqQixRQUFDYzt3QkFBUWQsV0FBVTs7MENBQ2pCLFFBQUNEO2dDQUFJQyxXQUFVOzBDQUNiLGNBQUEsUUFBQ0U7b0NBQUtGLFdBQVU7O3NEQUNkLFFBQUN2Szs0Q0FBYTRLLGVBQVk7Ozs7Ozt3Q0FBUzs7Ozs7Ozs7Ozs7OzBDQUl2QyxRQUFDSzswQ0FBUXJLLFlBQVlpRDs7Ozs7OzBDQUNyQixRQUFDOEc7MENBQUU7Ozs7Ozs7Ozs7OztrQ0FHTCxRQUFDVTt3QkFBUWQsV0FBVTs7MENBQ2pCLFFBQUNEO2dDQUFJQyxXQUFVOzBDQUNiLGNBQUEsUUFBQ0U7b0NBQUtGLFdBQVU7O3NEQUNkLFFBQUNqTDs0Q0FBY3NMLGVBQVk7Ozs7Ozt3Q0FBUzs7Ozs7Ozs7Ozs7OzBDQUl4QyxRQUFDSzswQ0FBUXJLLFlBQVl3RDs7Ozs7OzBDQUNyQixRQUFDdUc7MENBQUU7Ozs7Ozs7Ozs7OztrQ0FHTCxRQUFDVTt3QkFBUWQsV0FBVTs7MENBQ2pCLFFBQUNEO2dDQUFJQyxXQUFVOzBDQUNiLGNBQUEsUUFBQ0U7b0NBQUtGLFdBQVU7O3NEQUNkLFFBQUNuTDs0Q0FBV3dMLGVBQVk7Ozs7Ozt3Q0FBUzs7Ozs7Ozs7Ozs7OzBDQUlyQyxRQUFDSzswQ0FBUXJLLFlBQVkwRTs7Ozs7OzBDQUNyQixRQUFDcUY7MENBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7OzswQkFJUCxRQUFDSDtnQkFBUUQsV0FBVTs7a0NBQ2pCLFFBQUNEO3dCQUFJQyxXQUFVOzswQ0FDYixRQUFDRDtnQ0FBSUMsV0FBVTswQ0FDYixjQUFBLFFBQUNEOztzREFDQyxRQUFDRzs0Q0FBS0YsV0FBVTs7OERBQ2QsUUFBQ3RLO29EQUFRMkssZUFBWTs7Ozs7O2dEQUFTOzs7Ozs7O3NEQUdoQyxRQUFDVTtzREFBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7MENBSVIsUUFBQ2hCO2dDQUFJQyxXQUFVOzBDQUNiLGNBQUEsUUFBQ2dCO29DQUFNaEIsV0FBVTs7c0RBQ2YsUUFBQ2lCO3NEQUNDLGNBQUEsUUFBQ0M7O2tFQUNDLFFBQUNDO2tFQUFHOzs7Ozs7a0VBQ0osUUFBQ0E7a0VBQUc7Ozs7OztrRUFDSixRQUFDQTtrRUFBRzs7Ozs7O2tFQUNKLFFBQUNBO2tFQUFHOzs7Ozs7a0VBQ0osUUFBQ0E7a0VBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQUdSLFFBQUNDO3NEQUNFakgsY0FBY25DLEdBQUcsQ0FBQyxDQUFDMkMscUJBQ2xCLFFBQUN1Rzs7c0VBQ0MsUUFBQ0c7NERBQUdDLGNBQVc7c0VBQWMzRyxLQUFLTCxTQUFTOzs7Ozs7c0VBQzNDLFFBQUMrRzs0REFBR0MsY0FBVztzRUFBZ0IzRyxLQUFLL0QsT0FBTzs7Ozs7O3NFQUMzQyxRQUFDeUs7NERBQUdDLGNBQVc7NERBQWV0QixXQUFVO3NFQUNyQzNKLFlBQVlzRSxLQUFLSixXQUFXOzs7Ozs7c0VBRS9CLFFBQUM4Rzs0REFBR0MsY0FBVzs0REFBa0J0QixXQUFVO3NFQUN4QzNKLFlBQVlzRSxLQUFLSCxTQUFTOzs7Ozs7c0VBRTdCLFFBQUM2Rzs0REFDQ0MsY0FBVzs0REFDWHRCLFdBQVcsQ0FBQyxZQUFZLEVBQUVyRixLQUFLQyxTQUFTLEdBQUcsSUFBSSxxQkFBcUIscUJBQXFCO3NFQUV4RnZFLFlBQVlzRSxLQUFLQyxTQUFTOzs7Ozs7O21EQWJ0QkQsS0FBS0wsU0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tDQXNCakMsUUFBQ3lGO3dCQUFJQyxXQUFVOzswQ0FDYixRQUFDRDtnQ0FBSUMsV0FBVTswQ0FDYixjQUFBLFFBQUNEOztzREFDQyxRQUFDRzs0Q0FBS0YsV0FBVTs7OERBQ2QsUUFBQ3ZLO29EQUFhNEssZUFBWTs7Ozs7O2dEQUFTOzs7Ozs7O3NEQUdyQyxRQUFDVTtzREFBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7MENBSVIsUUFBQ2hCO2dDQUFJQyxXQUFVOzBDQUNiLGNBQUEsUUFBQ3BMO29DQUFvQmlNLE9BQU07b0NBQU9VLFFBQVE7OENBQ3hDLGNBQUEsUUFBQ2hOO3dDQUFTcUQsTUFBTXVELGVBQWVBLFlBQVl0QyxNQUFNLEdBQUdzQyxjQUFjSDs7MERBQ2hFLFFBQUN2RztnREFBTStNLFNBQVE7Ozs7OzswREFDZixRQUFDOU07Ozs7OzBEQUNELFFBQUNDO2dEQUFROE0sV0FBVyxDQUFDbkwsUUFBVUQsWUFBWUM7Ozs7OzswREFDM0MsUUFBQzlCO2dEQUFJZ04sU0FBUTtnREFBUUUsTUFBSztnREFBVUMsUUFBUTtvREFBQztvREFBRztvREFBRztvREFBRztpREFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzswQkFPbEUsUUFBQzFCO2dCQUFRRCxXQUFVOztrQ0FDakIsUUFBQ0Q7d0JBQUlDLFdBQVU7OzBDQUNiLFFBQUNEOztrREFDQyxRQUFDRzt3Q0FBS0YsV0FBVTs7MERBQ2QsUUFBQ3pLO2dEQUFTOEssZUFBWTs7Ozs7OzRDQUFTOzs7Ozs7O2tEQUdqQyxRQUFDVTtrREFBRzs7Ozs7Ozs7Ozs7OzBDQUdOLFFBQUNoQjtnQ0FBSUMsV0FBVTs7a0RBQ2IsUUFBQzRCO3dDQUFNNUIsV0FBVTs7MERBQ2YsUUFBQ3pLO2dEQUFTOEssZUFBWTs7Ozs7OzBEQUN0QixRQUFDd0I7Z0RBQ0N0QixNQUFLO2dEQUNMdUIsYUFBWTtnREFDWnhMLE9BQU9hO2dEQUNQNEssVUFBVSxDQUFDdEc7b0RBQ1RyRSxjQUFjcUUsTUFBTXVHLE1BQU0sQ0FBQzFMLEtBQUs7b0RBQ2hDZ0IsZUFBZTtnREFDakI7Ozs7Ozs7Ozs7OztrREFHSixRQUFDbkQ7d0NBQVF5RCxNQUFNMEQ7d0NBQWlCbUYsVUFBUzt3Q0FBY1QsV0FBVTs7MERBQy9ELFFBQUM3SztnREFBV2tMLGVBQVk7Ozs7Ozs0Q0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQ0FNdkMsUUFBQ047d0JBQUlDLFdBQVU7a0NBQ2IsY0FBQSxRQUFDZ0I7NEJBQU1oQixXQUFVOzs4Q0FDZixRQUFDaUI7OENBQ0MsY0FBQSxRQUFDQzs7MERBQ0MsUUFBQ0M7MERBQUc7Ozs7OzswREFDSixRQUFDQTswREFBRzs7Ozs7OzBEQUNKLFFBQUNBOzBEQUFHOzs7Ozs7MERBQ0osUUFBQ0E7MERBQUc7Ozs7OzswREFDSixRQUFDQTswREFBRzs7Ozs7OzBEQUNKLFFBQUNBOzBEQUFHOzs7Ozs7MERBQ0osUUFBQ0E7MERBQUc7Ozs7OzswREFDSixRQUFDQTswREFBRzs7Ozs7OzBEQUNKLFFBQUNBOzBEQUFHOzs7Ozs7MERBQ0osUUFBQ0E7MERBQUc7Ozs7OzswREFDSixRQUFDQTswREFBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7OENBR1IsUUFBQ0M7OENBQ0VsRixpQkFBaUJsRSxHQUFHLENBQUMsQ0FBQ2lCLHVCQUNyQixRQUFDaUk7OzhEQUNDLFFBQUNHO29EQUFHQyxjQUFXOzhEQUFRckksT0FBT2QsSUFBSTs7Ozs7OzhEQUNsQyxRQUFDa0o7b0RBQUdDLGNBQVc7OERBQVFySSxPQUFPd0YsSUFBSTs7Ozs7OzhEQUNsQyxRQUFDNEM7b0RBQUdDLGNBQVc7OERBQVNySSxPQUFPVSxLQUFLOzs7Ozs7OERBQ3BDLFFBQUMwSDtvREFBR0MsY0FBVzs4REFBUzVLLE9BQU9rRixJQUFJLENBQUMsQ0FBQ0gsUUFBVUEsTUFBTXhELEVBQUUsS0FBS2dCLE9BQU95QyxPQUFPLEdBQUdHLFNBQVM7Ozs7Ozs4REFDdEYsUUFBQ3dGO29EQUFHQyxjQUFXOzhEQUFlckksT0FBTytGLFVBQVU7Ozs7Ozs4REFDL0MsUUFBQ3FDO29EQUFHQyxjQUFXOzhEQUFPckksT0FBT0MsUUFBUTs7Ozs7OzhEQUNyQyxRQUFDbUk7b0RBQUdDLGNBQVc7b0RBQWF0QixXQUFVOzhEQUNuQzNKLFlBQVk0QyxPQUFPSSxTQUFTLElBQUk7Ozs7Ozs4REFFbkMsUUFBQ2dJO29EQUFHQyxjQUFXO29EQUFpQnRCLFdBQVU7OERBQ3ZDM0osWUFBWSxBQUFDNEMsQ0FBQUEsT0FBT00sT0FBTyxJQUFJLENBQUEsSUFBTU4sQ0FBQUEsT0FBT08sVUFBVSxJQUFJLENBQUE7Ozs7Ozs4REFFN0QsUUFBQzZIO29EQUFHQyxjQUFXO29EQUFhdEIsV0FBVTs4REFDbkMzSixZQUFZNEMsT0FBT0csWUFBWSxJQUFJSCxPQUFPSSxTQUFTLElBQUk7Ozs7Ozs4REFFMUQsUUFBQ2dJO29EQUFHQyxjQUFXOzhEQUFrQnJJLE9BQU9vRyxhQUFhOzs7Ozs7OERBQ3JELFFBQUNnQztvREFBR0MsY0FBVzs4REFDYixjQUFBLFFBQUNoQjt3REFDQ0MsTUFBSzt3REFDTFAsV0FBVTt3REFDVlEsU0FBUyxJQUFNckMsa0JBQWtCbEY7d0RBQ2pDZ0osVUFBVTFLLGdCQUFnQjBCLE9BQU9oQixFQUFFOzswRUFFbkMsUUFBQzNDO2dFQUFPK0ssZUFBWTs7Ozs7OzREQUNuQjlJLGdCQUFnQjBCLE9BQU9oQixFQUFFLEdBQUcsZUFBZTs7Ozs7Ozs7Ozs7OzsyQ0F6QnpDZ0IsT0FBT2hCLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFrQ3pCbUUsYUFBYSxrQkFDWixRQUFDMkQ7d0JBQUlDLFdBQVU7a0NBQ1prQyxNQUFNQyxJQUFJLENBQUM7NEJBQUV0SixRQUFRdUQ7d0JBQVcsR0FBRyxDQUFDZ0csR0FBR0MsUUFBVUEsUUFBUSxHQUFHckssR0FBRyxDQUFDLENBQUNzSywyQkFDaEUsUUFBQ2hDO2dDQUVDQyxNQUFLO2dDQUNMUCxXQUFXLENBQUMsZUFBZSxFQUFFM0ksZ0JBQWdCaUwsYUFBYSxjQUFjLElBQUk7Z0NBQzVFOUIsU0FBUyxJQUFNbEosZUFBZWdMOzBDQUU3QkE7K0JBTElBOzs7Ozs7Ozs7K0JBU1Q7Ozs7Ozs7MEJBR04sUUFBQ3JDO2dCQUFRRCxXQUFVOztrQ0FDakIsUUFBQ0Q7d0JBQUlDLFdBQVU7OzBDQUNiLFFBQUNEOztrREFDQyxRQUFDRzt3Q0FBS0YsV0FBVTs7MERBQ2QsUUFBQ2hMO2dEQUFRcUwsZUFBWTs7Ozs7OzRDQUFTOzs7Ozs7O2tEQUdoQyxRQUFDVTtrREFBRzs7Ozs7Ozs7Ozs7OzRCQUVMN0csZUFBZSxrQkFDZCxRQUFDZ0c7Z0NBQUtGLFdBQVU7O29DQUFvQjlGO29DQUFhOzs7Ozs7dUNBQy9DOzs7Ozs7O29CQUdMcEQsWUFBWStCLE1BQU0sS0FBSyxrQkFDdEIsUUFBQ2tIO3dCQUFJQyxXQUFVO2tDQUNiLGNBQUEsUUFBQ0k7c0NBQUU7Ozs7Ozs7Ozs7NkNBR0wsUUFBQ0w7d0JBQUlDLFdBQVU7a0NBQ2IsY0FBQSxRQUFDZ0I7NEJBQU1oQixXQUFVOzs4Q0FDZixRQUFDaUI7OENBQ0MsY0FBQSxRQUFDQzs7MERBQ0MsUUFBQ0M7MERBQUc7Ozs7OzswREFDSixRQUFDQTswREFBRzs7Ozs7OzBEQUNKLFFBQUNBOzBEQUFHOzs7Ozs7MERBQ0osUUFBQ0E7MERBQUc7Ozs7OzswREFDSixRQUFDQTswREFBRzs7Ozs7OzBEQUNKLFFBQUNBOzBEQUFHOzs7Ozs7MERBQ0osUUFBQ0E7MERBQUc7Ozs7OzswREFDSixRQUFDQTswREFBRzs7Ozs7OzBEQUNKLFFBQUNBOzBEQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs4Q0FHUixRQUFDQzs4Q0FDRXRLLFlBQVlrQixHQUFHLENBQUMsQ0FBQytCLDJCQUNoQixRQUFDbUg7OzhEQUNDLFFBQUNHO29EQUFHQyxjQUFXOzhEQUNadkgsV0FBVzNCLFNBQVMsR0FBRyxJQUFJQyxLQUFLMEIsV0FBVzNCLFNBQVMsRUFBRUUsa0JBQWtCLEtBQUs7Ozs7Ozs4REFFaEYsUUFBQytJO29EQUFHQyxjQUFXOzhEQUFRdkgsV0FBV08sU0FBUzs7Ozs7OzhEQUMzQyxRQUFDK0c7b0RBQUdDLGNBQVc7OERBQWdCdkgsV0FBV3dJLFdBQVc7Ozs7Ozs4REFDckQsUUFBQ2xCO29EQUFHQyxjQUFXOzhEQUFldkgsV0FBV3lJLGFBQWE7Ozs7Ozs4REFDdEQsUUFBQ25CO29EQUFHQyxjQUFXOzhEQUFRdkgsV0FBVzBJLElBQUk7Ozs7Ozs4REFDdEMsUUFBQ3BCO29EQUFHQyxjQUFXO29EQUFTdEIsV0FBVTs4REFDL0IzSixZQUFZMEQsV0FBV0UsTUFBTTs7Ozs7OzhEQUVoQyxRQUFDb0g7b0RBQUdDLGNBQVc7OERBQVF2SCxXQUFXMkksSUFBSSxJQUFJOzs7Ozs7OERBQzFDLFFBQUNyQjtvREFBR0MsY0FBVzs4REFDYixjQUFBLFFBQUNwQjt3REFBS0YsV0FBV0Ysb0JBQW9CL0YsV0FBV0MsTUFBTTtrRUFBSUQsV0FBV0MsTUFBTTs7Ozs7Ozs7Ozs7OERBRTdFLFFBQUNxSDtvREFBR0MsY0FBVzs4REFDWnZILFdBQVdDLE1BQU0sS0FBSywwQkFDckIsUUFBQytGO3dEQUFJQyxXQUFVOzswRUFDYixRQUFDTTtnRUFDQ0MsTUFBSztnRUFDTFAsV0FBVTtnRUFDVlEsU0FBUyxJQUFNdEMsdUJBQXVCbkUsV0FBVzlCLEVBQUUsRUFBRTswRUFDdEQ7Ozs7OzswRUFHRCxRQUFDcUk7Z0VBQ0NDLE1BQUs7Z0VBQ0xQLFdBQVU7Z0VBQ1ZRLFNBQVMsSUFBTXRDLHVCQUF1Qm5FLFdBQVc5QixFQUFFLEVBQUU7MEVBQ3REOzs7Ozs7Ozs7Ozs2RUFLSCxRQUFDaUk7d0RBQUtGLFdBQVU7a0VBQXVCOzs7Ozs7Ozs7Ozs7MkNBbENwQ2pHLFdBQVc5QixFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUE2Q2pDakIsOEJBQ0MsUUFBQytJO2dCQUFJQyxXQUFVO2dCQUF1QlEsU0FBUyxJQUFNdkosaUJBQWlCOzBCQUNwRSxjQUFBLFFBQUM4STtvQkFBSUMsV0FBVTtvQkFBY1EsU0FBUyxDQUFDL0UsUUFBVUEsTUFBTWtILGVBQWU7O3NDQUNwRSxRQUFDNUM7NEJBQUlDLFdBQVU7OzhDQUNiLFFBQUNEOztzREFDQyxRQUFDRzs0Q0FBS0YsV0FBVTs7OERBQ2QsUUFBQzNLO29EQUFNZ0wsZUFBWTs7Ozs7O2dEQUFTOzs7Ozs7O3NEQUc5QixRQUFDVTtzREFBRzs7Ozs7Ozs7Ozs7OzhDQUVOLFFBQUNUO29DQUNDQyxNQUFLO29DQUNMUCxXQUFVO29DQUNWUSxTQUFTLElBQU12SixpQkFBaUI7b0NBQ2hDMkwsY0FBVzs4Q0FFWCxjQUFBLFFBQUNqTjt3Q0FBSTBLLGVBQVk7Ozs7Ozs7Ozs7Ozs7Ozs7O3NDQUlyQixRQUFDTjs0QkFBSUMsV0FBVTtzQ0FDWnRKLE9BQU9zQixHQUFHLENBQUMsQ0FBQ3lELHNCQUNYLFFBQUNxRjtvQ0FBdUJkLFdBQVU7O3NEQUNoQyxRQUFDRDs7OERBQ0MsUUFBQ1c7OERBQVFqRixNQUFNSSxLQUFLOzs7Ozs7OERBQ3BCLFFBQUNxRTs4REFBTXpFLE1BQU10RCxJQUFJLEtBQUssUUFBUSxhQUFhc0QsTUFBTXRELElBQUksSUFBSTs7Ozs7Ozs7Ozs7O3NEQUczRCxRQUFDNEg7NENBQUlDLFdBQVU7OzhEQUNiLFFBQUNNO29EQUFPQyxNQUFLO29EQUFTUCxXQUFVO29EQUFpQlEsU0FBUyxJQUFNdEosU0FBUyxDQUFDLFlBQVksRUFBRXVFLE1BQU14RCxFQUFFLEVBQUU7OERBQ2hHLGNBQUEsUUFBQzdDO3dEQUFRaUwsZUFBWTs7Ozs7Ozs7Ozs7OERBRXZCLFFBQUNDO29EQUFPQyxNQUFLO29EQUFTUCxXQUFVO29EQUF1Q1EsU0FBUyxJQUFNbEQsa0JBQWtCN0IsTUFBTXhELEVBQUU7OERBQzlHLGNBQUEsUUFBQ3pDO3dEQUFTNkssZUFBWTs7Ozs7Ozs7Ozs7Ozs7Ozs7O21DQVhkNUUsTUFBTXhELEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQW1CNUI7Ozs7Ozs7QUFHVjtHQS9sQk14Qjs7UUFLYXBDO1FBK0Y0Q3dCOzs7S0FwR3pEWTtBQWltQk4sZUFBZUEsZUFBZSJ9
