import React from "react";
import { useLocation, Link } from "react-router-dom";
import ChevronForward from '../assets/chevron-forward.svg';

const Breadcrumb = ({ title, link, skipLinkSegments = [] }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter((segment) => segment);

  const formatText = (str) => {
    if (str === "datagovernance") {
      return "Data Governance";
    }

    if (str === "ai") {
      return "AI";
    }


    const withSpaces = str.replace(/-/g, ' ');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  };

  return (
    <nav aria-label="breadcrumb" style={styles.breadcrumbNav}>
      <ol style={styles.breadcrumbList}>
        {title && (
          <li style={styles.breadcrumbItem}>
            {link ? (
              <Link to={link} style={styles.link}>
                {title}
              </Link>
            ) : (
              <span style={styles.link}>{title}</span>
            )}
            {pathSegments.length > 0 && (
              <img src={ChevronForward} alt="Chevron Forward" style={styles.separatorIcon} />
            )}
          </li>
        )}
        {pathSegments.map((segment, index) => {
          const to = segment.toLowerCase() === "ai"
            ? "/"
            : "/" + pathSegments.slice(0, index + 1).join("/");
          return (
            <li key={index} style={styles.breadcrumbItem}>
              {index > 0 && (
                <img src={ChevronForward} alt="Chevron Forward" style={styles.separatorIcon} />
              )}
              {index === pathSegments.length - 1 || skipLinkSegments.includes(segment.toLowerCase()) ? (
                <span style={styles.active}>{formatText(segment)}</span>
              ) : (
                <Link to={to} style={styles.link}>
                  {formatText(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


const styles = {
  breadcrumbNav: {
    marginBottom: "16px",
  },
  breadcrumbList: {
    display: "flex",
    listStyle: "none",
    padding: 0,
    margin: 0,
    fontSize: "14px",
    color: "#6c757d",
  },
  breadcrumbItem: {
    display: "flex",
    alignItems: "center",
  },
  separatorIcon: {
    margin: "0 8px",
    width: "12px",
    height: "12px",
    verticalAlign: "middle",
  },
  link: {
    textDecoration: "none",
    color: "#6c757d",
    fontSize: "14px",
  },
  active: {
    color: "#8d77ba",
    fontSize: "14px",
  },
};

export default Breadcrumb;
