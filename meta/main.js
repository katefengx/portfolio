import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
  
    return data;
  }

  function getTimeOfDay(datetime) {
    const hour = datetime.getHours();
    if (hour >= 5 && hour < 11) return 'Morning';
    if (hour >= 11 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  }

  function getMostFrequent(arr) {
    const counts = d3.rollup(arr, v => v.length, d => d);
    return Array.from(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
            id: commit,
            url: 'https://github.com/vis-society/lab-7/commit/' + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            totalLines: lines.length,
            timeOfDay: getTimeOfDay(datetime),
            dayOfWeek: datetime.toLocaleString('en-US', { weekday: 'long' }),
        };
        Object.defineProperty(ret, 'lines', {
            value: lines,
            writable: false,
            enumerable: false,
            configurable: false
          });
    
          return ret;
      });
  }


  function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    const mostCommonTimeOfDay = getMostFrequent(commits.map(d => d.timeOfDay));
    const mostCommonDayOfWeek = getMostFrequent(commits.map(d => d.dayOfWeek));
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    const uniqueFiles = new Set(data.map(d => d.file));
    // add number files
    dl.append('dt').text('Number of Files')
    dl.append('dd').text(uniqueFiles.size);

    dl.append('dt').text('Most Active Time of Day');
    dl.append('dd').text(mostCommonTimeOfDay);

    dl.append('dt').text('Most Active Day of Week');
    dl.append('dd').text(mostCommonDayOfWeek);

  }

  

  let data = await loadData();
  let commits = processCommits(data);

  let xScale;
  let yScale;


  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }
    const [x0, x1] = selection.map((d) => d[0]); 
    const [y0, y1] = selection.map((d) => d[1]); 
    const x = xScale(commit.datetime); 
    const y = yScale(commit.hourFrac); 
    return x >= x0 && x <= x1 && y >= y0 && y <= y1; 
  } 

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }

  function createBrushSelector(svg) {
    svg.call(d3.brush().on('start brush end', brushed));
    svg.selectAll('.dots, .overlay ~ *').raise();
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  }
  
  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle')
      .classed('selected', d => isCommitSelected(selection, d));

    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }

  function renderScatterPlot(data, commits) {
    const width = 900;     // Previously 1000
    const height = 500;    // Previously 600
    const margin = { top: 10, right: 10, bottom: 40, left: 40 };
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);


    const rScale = d3
      .scaleSqrt() // Change only this line
      .domain([minLines, maxLines])
      .range([10, 30]); // adjust these values based on your experimentation

    xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, (d) => d.datetime))
      .range([0, width])
      .nice();
    
    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
    
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    const gridlines = svg
      .append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg
      .append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
    svg
      .append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');
    createBrushSelector(svg);

    dots
      .selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('fill', (d) =>
        ['Morning', 'Afternoon'].includes(d.timeOfDay) ? 'orange' : 'steelblue'
      )
      .attr('r', (d) => rScale(d.totalLines))
      .style('fill-opacity', 0.5) 
      .on('mouseenter', (event, commit) => {
          d3.select(event.currentTarget).style('fill-opacity', 1);
          renderTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
      })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).style('fill-opacity', 0.7);
          updateTooltipVisibility(false);
      });


    console.log(commits);
  };

  function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
  }

  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }

  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
  
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
