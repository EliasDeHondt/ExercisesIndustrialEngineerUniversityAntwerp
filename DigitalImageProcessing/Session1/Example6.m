% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 6

% 6.1. Read the image
moon = imread('moon.tif');
figure;
imshow(moon);
title('Original Moon Image');


% 6.2. Segment with a threshold
moon_norm = im2double(moon); % Convert to double between 0 and 1
level = graythresh(moon_norm); % Automatic threshold using Otsu
moon_bw = imbinarize(moon_norm, level); % Binarize image

figure;
imshow(moon_bw);
title('Binary Moon Image (Segmented Craters)');


% 6.3. Detect objects using regionprops
labeled = bwlabel(moon_bw); % Label connected components
stats = regionprops(labeled, 'Centroid', 'Perimeter', 'BoundingBox'); % Measure properties
min_perimeter = 50;
selected = stats([stats.Perimeter] > min_perimeter);


% 6.4. Overlay detected craters on the image
figure;
imshow(moon);
title('Detected Craters');
hold on;

for k = 1:length(selected)
    rectangle('Position', selected(k).BoundingBox, 'EdgeColor', 'r', 'LineWidth', 1.5);
end

hold off;