% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 3: Adjusting The Contrast Of An Image
img = imread('spectrum.tif');
img = im2double(img);
m_values = [0.2 0.5 0.8];
E_values = [2 5 10];
figure;
count = 1;
for m = m_values
    for E = E_values
        g = 1 ./ (1 + (m./img).^E);
        subplot(3,3,count);
        imshow(g), title(['m=',num2str(m),', E=',num2str(E)])
        count = count+1;
    end
end

logTrans = mat2gray(log(1 + img));
figure, imshow(logTrans), title('Logarithmic Transform')
