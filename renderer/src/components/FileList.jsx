export default function FileList({
  files,
  selectedFiles,
  toggleSelectFile,
  pandaGreen,
  darkGrey,
  hoverDarkGrey,
  lightText,
  listRef,
}) {
  return (
    <div
      ref={listRef}
      style={{
        marginTop: 10,
        maxHeight: 700,
        width: "50vw", // 50% of viewport width
        maxWidth: 800,
        overflowY: "auto",
        borderTop: "1px solid #555",
        backgroundColor: darkGrey,
        position: "relative", // needed for Selecto positioning
        userSelect: "none",
        fontSize: "0.9rem",
      }}
    >
      {/* Header bar with vertical separators */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          borderBottom: "1px solid #555",
          padding: "6px 8px",
          fontWeight: "bold",
          color: lightText,
          userSelect: "none",
          columnGap: "12px",
        }}
      >
        <div
          style={{
            borderRight: "1px solid #555",
            paddingRight: 8,
          }}
        >
          Name
        </div>
        <div
          style={{
            borderRight: "1px solid #555",
            paddingRight: 8,
          }}
        >
          Date Modified
        </div>
        <div
          style={{
            borderRight: "1px solid #555",
            paddingRight: 8,
          }}
        >
          Type
        </div>
        <div>Size</div>
      </div>

      {/* Files list */}
      {files.length === 0 ? (
        <div style={{ padding: 10, color: lightText }}>No files to display</div>
      ) : (
        files.map((file) => {
          const isSelected = selectedFiles.has(file.name);
          return (
            <div
              key={file.name}
              className="file-item" // needed for react-selecto
              data-name={file.name} // so we can read it later
              onClick={() => toggleSelectFile(file.name)}
              style={{
                padding: "6px 8px",
                cursor: "pointer",
                backgroundColor: isSelected
                  ? `rgba(76, 175, 80, 0.15)`
                  : darkGrey,
                borderLeft: isSelected
                  ? `6px solid ${pandaGreen}`
                  : "6px solid transparent",
                transition: "background-color 0.2s ease",
                color: lightText,
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                alignItems: "center",
                columnGap: "12px",
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = hoverDarkGrey;
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = darkGrey;
              }}
            >
              <div>{file.name}</div>
              <div>{new Date(file.modified).toLocaleDateString()}</div>
              <div>{file.isDirectory ? "Folder" : "File"}</div>
              <div>{file.size.toLocaleString()} bytes</div>
            </div>
          );
        })
      )}
    </div>
  );
}
