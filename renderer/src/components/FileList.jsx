import Selecto from "react-selecto";

export default function FileList({
  files,
  selectedFiles,
  setSelectedFiles, // new prop for bulk updates
  toggleSelectFile,
  pandaGreen,
  darkGrey,
  hoverDarkGrey,
  lightText,
}) {
  return (
    <div
      style={{
        marginTop: 10,
        maxHeight: 700,
        width: "50vw", // 50% of viewport width
        maxWidth: 800,
        overflowY: "auto",
        border: "1px solid #555",
        backgroundColor: darkGrey,
        position: "relative", // important for Selecto positioning
      }}
    >
      <Selecto
        selectableTargets={[".file-item"]}
        hitRate={50}
        selectByClick={true}
        selectFromInside={true}
        onSelect={(e) => {
          const selectedNames = e.selected.map((el) => el.dataset.name);
          setSelectedFiles(new Set(selectedNames));
        }}
      />

      {files.length === 0 && (
        <div style={{ padding: 10, color: lightText }}>No files to display</div>
      )}

      {files.map((file) => {
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
              backgroundColor: darkGrey,
              borderLeft: isSelected
                ? `6px solid ${pandaGreen}`
                : "6px solid transparent",
              userSelect: "none",
              transition: "background-color 0.2s ease",
              color: lightText,
            }}
            onMouseEnter={(e) => {
              if (!isSelected)
                e.currentTarget.style.backgroundColor = hoverDarkGrey;
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = darkGrey;
            }}
          >
            {file.name} - {file.size} bytes -{" "}
            {file.isDirectory ? "Folder" : "File"}
          </div>
        );
      })}
    </div>
  );
}
