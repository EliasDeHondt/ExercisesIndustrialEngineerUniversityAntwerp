% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

function vertical_length_cm = detectLines(dcmFile, angleMin, angleMax)
    % --- Pre-processing --- %
    tri_1 = dicomread(dcmFile);

    if size(tri_1, 3) == 3
        d_gray = rgb2gray(tri_1);
    else
        d_gray = tri_1;
    end

    BW = imbinarize(d_gray);
    BW = ~BW;
    edges = edge(BW,'canny',[0.03 0.15]);
    [H,theta,rho] = hough(edges);

    % get region info for calibration
    info = dicominfo(dcmFile);
    region = info.SequenceOfUltrasoundRegions;
    region_item = region.Item_1;

    % --- Hough Space Horizontal Lines (Dynamic Range) --- %
    idx_positive = (theta >= angleMin) & (theta <= angleMax);
    idx_negative = (theta >= -angleMax) & (theta <= -angleMin);
    idx_horizontal = idx_positive | idx_negative;

    H_only_horizontal = H;
    H_only_horizontal(:, ~idx_horizontal) = 0;

    NumPeaks = 10;
    P_all_horz = houghpeaks(H_only_horizontal, NumPeaks, ...
                           'Threshold', 0.2*max(H_only_horizontal(:)), ...
                           'NHoodSize', [11 11]);

    lines_all_horz = houghlines(edges, theta, rho, P_all_horz, ...
                                'FillGap', 70, 'MinLength', 100);

    % --- Remove lines near image edges --- %
    imgSize = size(tri_1);
    imgHeight = imgSize(1);
    imgWidth = imgSize(2);

    edgeMargin = 40;   % ignore top/bottom border lines
    minSpacing = 50;   % ignored space between lines
    validLines = [];


    for i = 1:length(lines_all_horz)
        y1 = lines_all_horz(i).point1(2);
        y2 = lines_all_horz(i).point2(2);
        y_mid = mean([y1, y2]);

        if y_mid > edgeMargin && y_mid < (imgHeight - edgeMargin)
            validLines = [validLines, lines_all_horz(i)];
        end
    end

    if isempty(validLines)
        warning('No valid horizontal lines detected in %s.', dcmFile);
        vertical_length_cm = NaN;
        return;
    end

    % sort by length
    line_lengths = arrayfun(@(L) norm(L.point1 - L.point2), validLines);
    [~, sortedIdx] = sort(line_lengths, 'descend');
    sortedLines = validLines(sortedIdx);

    % pick first (longest)
    selected = sortedLines(1);
    y_first = mean([selected.point1(2), selected.point2(2)]);

    % find second line (with enough distance)
    secondFound = false;
    for i = 2:length(sortedLines)
        y_candidate = mean([sortedLines(i).point1(2), sortedLines(i).point2(2)]);
        if abs(y_candidate - y_first) >= minSpacing
            second = sortedLines(i);
            secondFound = true;
            break;
        end
    end

    if ~secondFound
        warning('Only one line satisfied spacing requirements. Showing only one.');
        selectedLines = [selected];
    else
        selectedLines = [selected, second];
    end
    vertical_length_cm = 0; % initialize output so function doesn't crash if length < 2

    % --- Visualization & Calculation --- %
    figure; imshow(tri_1); hold on;
    title(['File: ', dcmFile]);
    x_min = region_item.RegionLocationMinX0;
    x_max = region_item.RegionLocationMaxX1;

    for i = 1:length(selectedLines)
        line_data = selectedLines(i);

        % Forced horizontal: use mean y-position
        y_level = mean([line_data.point1(2), line_data.point2(2)]);

        x_full = [x_min, x_max];
        y_full = [y_level, y_level];

        % Red line
        plot(x_full, y_full, 'Color', [1, 0, 0], 'LineWidth', 2);
    end

    if length(selectedLines) == 2
        yA = mean([selectedLines(1).point1(2), selectedLines(1).point2(2)]);
        yB = mean([selectedLines(2).point1(2), selectedLines(2).point2(2)]);

        y_top = min(yA, yB);
        y_bottom = max(yA, yB);

        x_mid = imgWidth / 2;
        plot([x_mid, x_mid], [y_top, y_bottom], 'Color', [1 1 0], 'LineWidth', 2);

        % length in cm
        vertical_length_px = abs(y_bottom - y_top);
        pixel_spacing_mm = region_item.PhysicalDeltaY;
        vertical_length_cm = vertical_length_px * pixel_spacing_mm;

        % display
        text(x_mid + 10, (y_top + y_bottom)/2, ...
            sprintf('Length = %.3f cm', vertical_length_cm), ...
            'Color', 'yellow', 'FontSize', 12, 'FontWeight', 'bold');
    end
end
