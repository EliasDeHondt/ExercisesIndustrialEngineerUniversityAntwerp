% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 4

% 4.1. Load images
moss = imread('moss.jpg');
squirrel = imread('squirrel.jpg');


% 4.2. Convert the squirrel image to grayscale or keep RGB
imshow(squirrel);


% 4.3. Select the squirrel using roipoly
mask = roipoly(squirrel);
figure;
imshow(mask);


% 4.4. Extract the squirrel
squirrel_cut = uint8(zeros(size(squirrel)));
for c = 1:3
    channel = squirrel(:,:,c);
    channel(~mask) = 0;
    squirrel_cut(:,:,c) = channel;
end

row_offset = 50;
col_offset = 100;
moss_copy = moss;

[moss_height, moss_width, ~] = size(moss);
[sq_height, sq_width, ~] = size(squirrel);

end_row = min(row_offset + sq_height - 1, moss_height);
end_col = min(col_offset + sq_width - 1, moss_width);

if row_offset > moss_height || col_offset > moss_width
    error('Offsets are beyond moss image dimensions.');
end

eff_height = end_row - row_offset + 1;
eff_width = end_col - col_offset + 1;

for c = 1:3
    moss_channel = moss_copy(:,:,c);
    squirrel_channel = squirrel_cut(:,:,c);

    moss_patch = moss_channel(row_offset:end_row, col_offset:end_col);

    squirrel_channel_part = squirrel_channel(1:eff_height, 1:eff_width);

    new_patch = moss_patch .* uint8(squirrel_channel_part == 0) + squirrel_channel_part;

    moss_channel(row_offset:end_row, col_offset:end_col) = new_patch;

    moss_copy(:,:,c) = moss_channel;
end
figure;
imshow(moss_copy);
title('Squirrel inserted on Moss');