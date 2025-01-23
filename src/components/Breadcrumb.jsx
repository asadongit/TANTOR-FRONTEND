import React from "react";
import { useLocation, Link } from "react-router-dom";

const Breadcrumb = ({ title, link }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter((segment) => segment);

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <nav aria-label="breadcrumb" style={styles.breadcrumbNav}>
      <ol style={styles.breadcrumbList}>
        <li style={styles.breadcrumbItem}>
          {/* <span style={styles.link}>{title}</span> */}
          <Link to={link} style={styles.link}>
                  {title}
                </Link>
          <span style={styles.separator}>&gt;</span>
        </li>

        {pathSegments.map((segment, index) => {
          const to = "/" + pathSegments.slice(0, index + 1).join("/");

          return (
            <li key={index} style={styles.breadcrumbItem}>
              {index > 0 && <span style={styles.separator}>&gt;</span>}
              {index === pathSegments.length - 1 ? (
                <span style={styles.active}>{capitalize(segment)}</span>
              ) : (
                <Link to={to} style={styles.link}>
                  {capitalize(segment)}
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
  separator: {
    margin: "0 8px",
    color: "#6c757d",
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
