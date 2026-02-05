export function parse_csv_from_string(str) {
  const rows = str.trim().split('\n');
  
  return rows.map(row => row.split(',').map(Number));
}

export function parse_csv_from_file(filepath) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const str = e.target.result;
      
      const data = parse_csv_from_string(str);
      
      resolve(result);
    };

    reader.onerror = reject;
    reader.readAsText(file);
  });
}
